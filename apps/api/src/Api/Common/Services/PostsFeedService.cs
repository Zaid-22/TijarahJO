using System.Globalization;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Caching.Memory;
using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Api.Common.Services
{
    public sealed class PostsFeedService(IPostListingQueryService postListingQueries, IMemoryCache cache) : IPostsFeedService
    {
        private const int MaxFeedPageSize = 200;
        private readonly IPostListingQueryService _postListingQueries = postListingQueries;
        private readonly IMemoryCache _cache = cache;

        public sealed record NormalizedFeedRequest(int Page, int Limit);

        public NormalizedFeedRequest NormalizeRequest(
            int? page,
            int? limit
        )
        {
            int normalizedPage = page.GetValueOrDefault(1);
            if (normalizedPage < 1)
            {
                normalizedPage = 1;
            }

            int normalizedLimit = limit.GetValueOrDefault(20);
            if (normalizedLimit < 1)
            {
                normalizedLimit = 20;
            }
            if (normalizedLimit > MaxFeedPageSize)
            {
                normalizedLimit = MaxFeedPageSize;
            }

            return new NormalizedFeedRequest(normalizedPage, normalizedLimit);
        }

        public async Task<FeedResponse> FetchPostsFeedAsync(NormalizedFeedRequest request, CancellationToken cancellationToken = default)
        {
            string cacheKey = $"posts-feed|{request.Page}|{request.Limit}";
            if (_cache.TryGetValue(cacheKey, out FeedResponse? cached) && cached is not null)
            {
                return cached;
            }

            PostListingVisibilityMode visibility = PostListingVisibilityMode.PublicVisible;

            PostListingPageResult pageResult = await _postListingQueries.QueryAsync(new PostListingQuery
            {
                Page = request.Page,
                Limit = request.Limit,
                Visibility = visibility,
                SortField = PostListingSortField.CreatedAt,
                SortAscending = false
            }, cancellationToken);

            var posts = new List<FeedPostItem>();
            foreach (PostListingRow row in pageResult.Posts)
            {
                IReadOnlyList<string> images = row.Images;
                posts.Add(new FeedPostItem
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

            int totalPages = pageResult.TotalPosts > 0
                ? (int)Math.Ceiling(pageResult.TotalPosts / (double)request.Limit)
                : 0;

            FeedResponse response = new()
            {
                Success = true,
                Posts = posts,
                Pagination = new FeedPagination
                {
                    CurrentPage = request.Page,
                    TotalPages = totalPages,
                    TotalPosts = pageResult.TotalPosts,
                    PostsPerPage = request.Limit
                }
            };

            _cache.Set(
                cacheKey,
                response,
                new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(30)
                });

            return response;
        }
    }

    public sealed class FeedResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; init; }

        [JsonPropertyName("posts")]
        public IReadOnlyList<FeedPostItem> Posts { get; init; } = [];

        [JsonPropertyName("pagination")]
        public FeedPagination Pagination { get; init; } = new FeedPagination();
    }

    public sealed class FeedPagination
    {
        [JsonPropertyName("currentPage")]
        public int CurrentPage { get; init; }

        [JsonPropertyName("totalPages")]
        public int TotalPages { get; init; }

        [JsonPropertyName("totalPosts")]
        public int TotalPosts { get; init; }

        [JsonPropertyName("postsPerPage")]
        public int PostsPerPage { get; init; }
    }

    public sealed class FeedPostItem
    {
        [JsonPropertyName("id")]
        public string Id { get; init; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name { get; init; } = string.Empty;

        [JsonPropertyName("price")]
        public decimal Price { get; init; }

        [JsonPropertyName("location")]
        public string Location { get; init; } = "Jordan";

        [JsonPropertyName("area")]
        public string? Area { get; init; }

        [JsonPropertyName("seller")]
        public string Seller { get; init; } = string.Empty;

        [JsonPropertyName("sellerId")]
        public string SellerId { get; init; } = string.Empty;

        [JsonPropertyName("category")]
        public string Category { get; init; } = string.Empty;

        [JsonPropertyName("categoryId")]
        public string CategoryId { get; init; } = string.Empty;

        [JsonPropertyName("image")]
        public string Image { get; init; } = string.Empty;

        [JsonPropertyName("images")]
        public IReadOnlyList<string> Images { get; init; } = [];

        [JsonPropertyName("phone")]
        public string Phone { get; init; } = string.Empty;

        [JsonPropertyName("description")]
        public string Description { get; init; } = string.Empty;

        [JsonPropertyName("createdAt")]
        public string CreatedAt { get; init; } = string.Empty;

        [JsonPropertyName("updatedAt")]
        public string UpdatedAt { get; init; } = string.Empty;

        [JsonPropertyName("views")]
        public long Views { get; init; }

        [JsonPropertyName("status")]
        public string Status { get; init; } = "ACTIVE";
    }
}
