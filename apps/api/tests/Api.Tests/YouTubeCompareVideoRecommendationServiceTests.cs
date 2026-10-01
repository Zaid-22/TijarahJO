using System.Net;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TijarahJo.Application;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Common;
using TijarahJo.Domain.Models;
using TijarahJo.Infrastructure.Services;

namespace TijarahJo.Api.Tests;

public sealed class YouTubeCompareVideoRecommendationServiceTests
{
    [Fact]
    public async Task RecommendAsync_FallsBackToEnglishSearch_WhenArabicSearchFindsNoVideo()
    {
        var handler = new RecordingYouTubeHandler();
        var service = new YouTubeCompareVideoRecommendationService(
            new HttpClient(handler),
            new StubPostReadService(),
            new StubCategoryService(),
            new NoopCacheService(),
            Options.Create(new YouTubeSettings { ApiKey = "test-youtube-key" }),
            NullLogger<YouTubeCompareVideoRecommendationService>.Instance);

        CompareVideoRecommendationResult result = await service.RecommendAsync([10], "ar");

        CompareVideoRecommendation video = Assert.Single(result.Videos);
        Assert.True(result.Success);
        Assert.True(result.IsConfigured);
        Assert.Equal("english-video", video.VideoId);
        Assert.Contains(handler.SearchRequests, request => request.Language == "ar");
        Assert.Contains(handler.SearchRequests, request => request.Language == "en");
        Assert.DoesNotContain("+", video.SearchQuery, StringComparison.Ordinal);
    }

    [Fact]
    public async Task RecommendAsync_PrefersLongerReviewVideo_OverShortClip()
    {
        var handler = new LongVideoPreferenceYouTubeHandler();
        var service = new YouTubeCompareVideoRecommendationService(
            new HttpClient(handler),
            new StubPostReadService(),
            new StubCategoryService(),
            new NoopCacheService(),
            Options.Create(new YouTubeSettings { ApiKey = "test-youtube-key" }),
            NullLogger<YouTubeCompareVideoRecommendationService>.Instance);

        CompareVideoRecommendationResult result = await service.RecommendAsync([10], "en");

        CompareVideoRecommendation video = Assert.Single(result.Videos);
        Assert.Equal("long-review", video.VideoId);
    }

    private sealed class RecordingYouTubeHandler : HttpMessageHandler
    {
        public List<(string Language, string Query)> SearchRequests { get; } = [];

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            if (request.RequestUri?.AbsolutePath.EndsWith("/youtube/v3/search", StringComparison.OrdinalIgnoreCase) == true)
            {
                Dictionary<string, string> query = ParseQuery(request.RequestUri.Query);
                string language = query.GetValueOrDefault("relevanceLanguage", string.Empty);
                SearchRequests.Add((language, query.GetValueOrDefault("q", string.Empty)));

                string body = language == "en"
                    ? """{"items":[{"id":{"videoId":"english-video"}}]}"""
                    : """{"items":[]}""";

                return Json(body);
            }

            if (request.RequestUri?.AbsolutePath.EndsWith("/youtube/v3/videos", StringComparison.OrdinalIgnoreCase) == true)
            {
                return Json(
                    """
                    {
                      "items": [
                        {
                          "id": "english-video",
                          "snippet": {
                            "title": "Mahindra KUV100 NXT K6 Review",
                            "description": "Full review of the compact crossover.",
                            "channelTitle": "Auto Reviews",
                            "publishedAt": "2024-01-01T00:00:00Z",
                            "defaultLanguage": "en",
                            "defaultAudioLanguage": "en",
                            "thumbnails": {
                              "medium": { "url": "https://img.youtube.com/vi/english-video/mqdefault.jpg" }
                            }
                          },
                          "statistics": { "viewCount": "12345" }
                        }
                      ]
                    }
                    """);
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound));
        }

        private static Task<HttpResponseMessage> Json(string body)
        {
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(body, System.Text.Encoding.UTF8, "application/json")
            });
        }

        private static Dictionary<string, string> ParseQuery(string query)
        {
            return query.TrimStart('?')
                .Split('&', StringSplitOptions.RemoveEmptyEntries)
                .Select(part => part.Split('=', 2))
                .Where(parts => parts.Length == 2)
                .ToDictionary(
                    parts => Uri.UnescapeDataString(parts[0]),
                    parts => Uri.UnescapeDataString(parts[1].Replace("+", " ", StringComparison.Ordinal)));
        }
    }

    private sealed class LongVideoPreferenceYouTubeHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            if (request.RequestUri?.AbsolutePath.EndsWith("/youtube/v3/search", StringComparison.OrdinalIgnoreCase) == true)
            {
                return Json("""{"items":[{"id":{"videoId":"short-clip"}},{"id":{"videoId":"long-review"}}]}""");
            }

            if (request.RequestUri?.AbsolutePath.EndsWith("/youtube/v3/videos", StringComparison.OrdinalIgnoreCase) == true)
            {
                return Json(
                    """
                    {
                      "items": [
                        {
                          "id": "short-clip",
                          "snippet": {
                            "title": "Mahindra KUV100 NXT K6 Review",
                            "description": "Quick review clip.",
                            "channelTitle": "Short Auto",
                            "publishedAt": "2024-01-01T00:00:00Z",
                            "defaultLanguage": "en",
                            "defaultAudioLanguage": "en",
                            "thumbnails": {
                              "medium": { "url": "https://img.youtube.com/vi/short-clip/mqdefault.jpg" }
                            }
                          },
                          "statistics": { "viewCount": "10000000" },
                          "contentDetails": { "duration": "PT55S" }
                        },
                        {
                          "id": "long-review",
                          "snippet": {
                            "title": "Mahindra KUV100 NXT K6 Full Review",
                            "description": "Detailed review and buying guide.",
                            "channelTitle": "Auto Reviews",
                            "publishedAt": "2024-01-01T00:00:00Z",
                            "defaultLanguage": "en",
                            "defaultAudioLanguage": "en",
                            "thumbnails": {
                              "medium": { "url": "https://img.youtube.com/vi/long-review/mqdefault.jpg" }
                            }
                          },
                          "statistics": { "viewCount": "1000" },
                          "contentDetails": { "duration": "PT15M" }
                        }
                      ]
                    }
                    """);
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound));
        }

        private static Task<HttpResponseMessage> Json(string body)
        {
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(body, System.Text.Encoding.UTF8, "application/json")
            });
        }
    }

    private sealed class StubPostReadService : IPostReadService
    {
        public Task<PostReadResult> GetByIdAsync(int postId, CancellationToken cancellationToken = default)
            => Task.FromResult(new PostReadResult
            {
                Success = true,
                Post = new Post(
                    new PostModel(
                        postId,
                        userid: 1,
                        categoryid: 2,
                        posttitle: "Mahindra KUV100 NXT K6+",
                        postdescription: "Compact city crossover",
                        price: 5000,
                        status: 1,
                        createdat: DateTime.UtcNow,
                        isdeleted: false))
            });

        public Task<PostExistsResult> ExistsAsync(int postId, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<PostReadCollectionResult> GetByUserIdAsync(int userId, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<PostReadCollectionResult> GetByCategoryIdAsync(int categoryId, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<PostViewIncrementResult> IncrementViewsAsync(int postId, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();
    }

    private sealed class StubCategoryService : ICategoryService
    {
        public Task<IReadOnlyList<CategoryModel>> GetAllCategoriesAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<Category?> FindAsync(int? categoryId, CancellationToken cancellationToken = default)
            => Task.FromResult<Category?>(
                new Category(
                    new CategoryModel(
                        categoryid: categoryId,
                        categoryname: "Cars",
                        createdat: DateTime.UtcNow,
                        isdeleted: false)));

        public Category Create(CategoryModel model)
            => throw new NotImplementedException();

        public Task<bool> SaveAsync(Category category, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<bool> DeleteCategoryAsync(int? categoryId, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<bool> DoesCategoryExistAsync(int? categoryId, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();
    }

    private sealed class NoopCacheService : ICacheService
    {
        public Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
            => Task.FromResult<T?>(default);

        public Task SetAsync<T>(string key, T value, TimeSpan? absoluteExpireTime = null, TimeSpan? unusedExpireTime = null, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task RemoveAsync(string key, CancellationToken cancellationToken = default)
            => Task.CompletedTask;
    }
}
