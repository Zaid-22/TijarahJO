using System.Globalization;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.Application.Common;

namespace TijarahJoDB.DAL.Queries;

public sealed class SearchReadService : ISearchReadService
{
    private readonly PostListingQueryService _postListingQueries;

    public SearchReadService(PostListingQueryService postListingQueries)
    {
        _postListingQueries = postListingQueries;
    }

    public SearchResult Search(SearchQueryRequestModel query)
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
                throw new ArgumentException("Invalid status. Allowed values: ACTIVE, SOLD, DELETED.", nameof(query.Status));
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
                visibility = PostListingVisibilityMode.DeletedOnly;
            }
        }

        PostListingPageResult pageResult = _postListingQueries.Query(new PostListingQuery
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
        });

        var posts = new List<SearchPostResult>();
        foreach (PostListingRow row in pageResult.Posts)
        {
            IReadOnlyList<string> images = row.Images;
            posts.Add(new SearchPostResult
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
                UpdatedAt = row.CreatedAt.ToString("o"),
                Views = row.Views,
                Status = row.ClientStatus
            });
        }

        int totalPages = pageResult.TotalPosts > 0 ? (int)Math.Ceiling(pageResult.TotalPosts / (double)limit) : 0;
        return new SearchResult
        {
            Success = true,
            Posts = posts,
            Pagination = new SearchPaginationResult
            {
                CurrentPage = page,
                TotalPages = totalPages,
                TotalPosts = pageResult.TotalPosts,
                PostsPerPage = limit
            }
        };
    }
}
