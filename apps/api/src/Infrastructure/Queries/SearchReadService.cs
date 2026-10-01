using System.Globalization;
using System.Collections.Concurrent;
using Microsoft.Extensions.Caching.Memory;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Common;

namespace TijarahJo.Infrastructure.Queries;

public sealed class SearchReadService(
    IPostListingQueryService postListingQueries,
    IMemoryCache cache) : ISearchReadService, ISearchCacheInvalidationService
{
    private static readonly ConcurrentDictionary<string, byte> CacheKeys = new(StringComparer.Ordinal);

    public async Task<SearchReadResult> SearchAsync(SearchQueryModel query, CancellationToken cancellationToken = default)
    {
        int page = query.Page.GetValueOrDefault(1);
        if (page < 1)
        {
            page = 1;
        }

        int limit = query.Limit.GetValueOrDefault(20);
        if (limit < 1)
        {
            limit = 20;
        }
        if (limit > 200)
        {
            limit = 200;
        }

        string normalizedSortBy = (query.SortBy ?? "date").Trim().ToLowerInvariant();
        bool ascending = string.Equals(query.SortOrder?.Trim(), "asc", StringComparison.OrdinalIgnoreCase);
        PostListingSortField sortField = normalizedSortBy switch
        {
            "price" => PostListingSortField.Price,
            "views" => PostListingSortField.Views,
            _ => PostListingSortField.CreatedAt
        };

        int? categoryId = null;
        string? categoryNameLike = null;
        if (!string.IsNullOrWhiteSpace(query.Category))
        {
            string categoryFilter = query.Category!.Trim();
            if (int.TryParse(categoryFilter, out int parsedCategoryId) && parsedCategoryId > 0)
            {
                categoryId = parsedCategoryId;
            }
            else
            {
                categoryNameLike = categoryFilter;
            }
        }

        PostListingVisibilityMode visibility = PostListingVisibilityMode.PublicVisible;
        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            if (!PostStatusPolicy.TryNormalizeClientStatus(query.Status, out string normalizedStatus))
            {
                throw new ArgumentException("Invalid status. Allowed values: ACTIVE, SOLD.", nameof(query));
            }

            if (normalizedStatus == "ACTIVE")
            {
                visibility = PostListingVisibilityMode.ActiveOnly;
            }
            else if (normalizedStatus == "SOLD")
            {
                visibility = PostListingVisibilityMode.SoldOnly;
            }
            else
            {
                throw new ArgumentException("Invalid status. Allowed values: ACTIVE, SOLD.", nameof(query));
            }
        }

        string cacheKey = BuildCacheKey(query, page, limit, visibility, sortField, ascending, categoryId, categoryNameLike);
        if (cache.TryGetValue(cacheKey, out SearchReadResult? cachedResult) && cachedResult is not null)
        {
            return cachedResult;
        }

        PostListingPageResult pageResult = await postListingQueries.QueryAsync(new PostListingQuery
        {
            Page = page,
            Limit = limit,
            Visibility = visibility,
            SortField = sortField,
            SortAscending = ascending,
            SearchTerm = query.Query,
            CategoryId = categoryId,
            CategoryNameLike = categoryNameLike,
            CityLike = query.City,
            MinPrice = query.MinPrice,
            MaxPrice = query.MaxPrice
        }, cancellationToken);

        var posts = new List<SearchPostReadModel>();
        foreach (PostListingRow row in pageResult.Posts)
        {
            IReadOnlyList<string> images = row.Images;
            posts.Add(new SearchPostReadModel
            {
                Id = row.PostId.ToString(CultureInfo.InvariantCulture),
                Name = row.PostTitle,
                Price = row.Price,
                Location = string.IsNullOrWhiteSpace(row.City) ? "Jordan" : row.City,
                LocationAr = string.IsNullOrWhiteSpace(row.CityAr) ? "الأردن" : row.CityAr,
                Area = string.IsNullOrWhiteSpace(row.Area) ? null : row.Area,
                AreaAr = string.IsNullOrWhiteSpace(row.AreaAr) ? null : row.AreaAr,
                Seller = row.SellerName,
                SellerId = row.UserId.ToString(CultureInfo.InvariantCulture),
                Category = row.CategoryName,
                CategoryId = row.CategoryId.ToString(CultureInfo.InvariantCulture),
                Image = images.Count > 0 ? images[0] : string.Empty,
                Images = images,
                Phone = string.Empty, // Phone is not exposed on public search results; available on the authenticated post-detail endpoint only.
                Description = row.PostDescription,
                CreatedAt = row.CreatedAt.ToString("o"),
                UpdatedAt = row.UpdatedAt.ToString("o"),
                Views = row.Views,
                Status = row.ClientStatus
            });
        }

        int totalPages = pageResult.TotalPosts > 0 ? (int)Math.Ceiling(pageResult.TotalPosts / (double)limit) : 0;
        SearchReadResult result = new()
        {
            Success = true,
            Posts = posts,
            Pagination = new SearchPaginationReadModel
            {
                CurrentPage = page,
                TotalPages = totalPages,
                TotalPosts = pageResult.TotalPosts,
                PostsPerPage = limit
            }
        };

        cache.Set(
            cacheKey,
            result,
            new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(30)
            });
        CacheKeys[cacheKey] = 0;

        return result;
    }

    public void InvalidateAll()
    {
        foreach ((string cacheKey, _) in CacheKeys)
        {
            cache.Remove(cacheKey);
        }

        CacheKeys.Clear();
    }

    private static string BuildCacheKey(
        SearchQueryModel query,
        int page,
        int limit,
        PostListingVisibilityMode visibility,
        PostListingSortField sortField,
        bool ascending,
        int? categoryId,
        string? categoryNameLike)
    {
        return string.Join('|',
            "search",
            page,
            limit,
            visibility,
            sortField,
            ascending,
            query.Query?.Trim() ?? string.Empty,
            categoryId?.ToString(CultureInfo.InvariantCulture) ?? string.Empty,
            categoryNameLike?.Trim() ?? string.Empty,
            query.City?.Trim() ?? string.Empty,
            query.MinPrice?.ToString(CultureInfo.InvariantCulture) ?? string.Empty,
            query.MaxPrice?.ToString(CultureInfo.InvariantCulture) ?? string.Empty,
            query.Status?.Trim() ?? string.Empty);
    }
}
