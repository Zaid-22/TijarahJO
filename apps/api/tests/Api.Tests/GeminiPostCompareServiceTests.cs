using System.Net;
using System.Reflection;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Infrastructure.DataAccess;
using TijarahJo.Infrastructure.Services;

namespace TijarahJo.Api.Tests;

public sealed class GeminiPostCompareServiceTests
{
    [Fact]
    public async Task GeminiRequest_SendsApiKeyHeader_WithoutQueryStringKey()
    {
        var handler = new RecordingGeminiHandler();
        var service = new GeminiPostCompareService(
            new DatabaseConnectionString("Server=localhost;Database=TijarahJoDB;"),
            new NoopCacheService(),
            new HttpClient(handler),
            Options.Create(new GeminiSettings
            {
                ApiKey = "test-api-key",
                ModelName = "gemini-test-model",
                FallbackModelName = ""
            }),
            NullLogger<GeminiPostCompareService>.Instance);

        MethodInfo method = typeof(GeminiPostCompareService).GetMethod(
            "CallGeminiAsync",
            BindingFlags.Instance | BindingFlags.NonPublic)!;

        var task = (Task<PostCompareResult>)method.Invoke(
            service,
            [
                new List<PostForComparison>
                {
                    new()
                    {
                        PostId = 1,
                        Name = "Phone",
                        Price = 120,
                        Category = "Electronics",
                        Description = "Clean phone",
                        City = "Amman",
                        Views = 7
                    },
                    new()
                    {
                        PostId = 2,
                        Name = "Tablet",
                        Price = 150,
                        Category = "Electronics",
                        Description = "Clean tablet",
                        City = "Amman",
                        Views = 9
                    }
                },
                "en",
                CancellationToken.None
            ])!;

        PostCompareResult result = await task;

        Assert.True(result.Success);
        Assert.NotNull(handler.LastRequestUri);
        Assert.DoesNotContain("key=", handler.LastRequestUri!.Query, StringComparison.OrdinalIgnoreCase);
        Assert.Equal("test-api-key", handler.LastApiKeyHeader);
    }

    private sealed class RecordingGeminiHandler : HttpMessageHandler
    {
        public Uri? LastRequestUri { get; private set; }
        public string? LastApiKeyHeader { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            LastRequestUri = request.RequestUri;
            LastApiKeyHeader = request.Headers.TryGetValues("x-goog-api-key", out IEnumerable<string>? values)
                ? values.SingleOrDefault()
                : null;

            string aiJson = JsonSerializer.Serialize(new
            {
                postSummaries = new[]
                {
                    new { postName = "Phone", summary = "Good daily phone." },
                    new { postName = "Tablet", summary = "Good media tablet." }
                },
                priceComparison = "Tablet costs more.",
                featureDifferences = new[]
                {
                    new { postName = "Phone", features = new[] { "Portable" } },
                    new { postName = "Tablet", features = new[] { "Larger screen" } }
                },
                prosCons = new[]
                {
                    new { postName = "Phone", pros = new[] { "Lower price" }, cons = new[] { "Small screen" } },
                    new { postName = "Tablet", pros = new[] { "Large screen" }, cons = new[] { "Higher price" } }
                },
                bestFor = new
                {
                    budget = "Phone",
                    performance = "Tablet",
                    dailyUse = "Phone"
                },
                finalRecommendation = new
                {
                    winnerName = "Phone",
                    bestFor = "Daily use",
                    reason = "It is cheaper."
                }
            });

            string geminiJson = JsonSerializer.Serialize(new
            {
                candidates = new[]
                {
                    new
                    {
                        content = new
                        {
                            parts = new[] { new { text = aiJson } }
                        }
                    }
                }
            });

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(geminiJson, Encoding.UTF8, "application/json")
            });
        }
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
