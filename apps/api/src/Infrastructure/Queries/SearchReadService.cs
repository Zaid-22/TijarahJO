using System.Globalization;
using Microsoft.Extensions.Caching.Memory;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Common;

namespace TijarahJo.Infrastructure.Queries;

public sealed class SearchReadService : ISearchReadService
{
    private readonly IPostListingQueryService _postListingQueries;
    private readonly IMemoryCache _cache;

    public SearchReadService(IPostListingQueryService postListingQueries, IMemoryCache cache)
    {
        _postListingQueries = postListingQueries;
        _cache = cache;
    }

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
                throw new ArgumentException("Invalid status. Allowed values: ACTIVE, SOLD.", nameof(query.Status));
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
                throw new ArgumentException("Invalid status. Allowed values: ACTIVE, SOLD.", nameof(query.Status));
            }
        }

        string cacheKey = BuildCacheKey(query, page, limit, visibility, sortField, ascending, categoryId, categoryNameLike);
        if (_cache.TryGetValue(cacheKey, out SearchReadResult? cachedResult) && cachedResult is not null)
        {
            return cachedResult;
        }

        PostListingPageResult pageResult = await _postListingQueries.QueryAsync(new PostListingQuery
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
                Area = string.IsNullOrWhiteSpace(row.Area) ? null : row.Area,
                Seller = row.SellerName,
                SellerId = row.UserId.ToString(CultureInfo.InvariantCulture),
                Category = row.CategoryName,
                CategoryId = row.CategoryId.ToString(CultureInfo.InvariantCulture),
                Image = images.Count > 0 ? images[0] : string.Empty,
                Images = images,
                Phone = string.Empty,
                Description = row.PostDescription,
                CreatedAt = row.CreatedAt.ToString("o"),
                UpdatedAt = row.UpdatedAt.ToString("o"),
                Views = row.Views,
                Status = row.ClientStatus
            });
        }

        int totalPages = pageResult.TotalPosts > 0 ? (int)Math.Ceiling(pageResult.TotalPosts / (double)limit) : 0;
        SearchReadResult result = new SearchReadResult
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

        _cache.Set(
            cacheKey,
            result,
            new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(30)
            });

        return result;
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
