using System.Net;
using System.Text.Json;

namespace TijarahJoDBAPI.Integration.Tests;

public sealed class ApiContractIntegrationTests
{
    private static Uri RequireBaseUri()
    {
        var baseUrl = Environment.GetEnvironmentVariable("BASE_URL");
        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            throw new InvalidOperationException("Integration tests require BASE_URL to be set.");
        }

        return new Uri(baseUrl, UriKind.Absolute);
    }

    [Fact]
    public async Task SwaggerContract_ExposesVersionedRoutes()
    {
        using var client = new HttpClient
        {
            BaseAddress = RequireBaseUri(),
            Timeout = TimeSpan.FromSeconds(8)
        };

        HttpResponseMessage response = await client.GetAsync("/swagger/v1/swagger.json");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        string content = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(content));

        using JsonDocument json = JsonDocument.Parse(content);
        JsonElement paths = json.RootElement.GetProperty("paths");

        bool hasSearchRoute =
            paths.TryGetProperty("/api/v1/search", out _) ||
            paths.TryGetProperty("/api/v{version}/search", out _);
        bool hasFeedRoute =
            paths.TryGetProperty("/api/v1/posts/feed", out _) ||
            paths.TryGetProperty("/api/v{version}/posts/feed", out _);
        bool hasRecentChatRoute =
            paths.TryGetProperty("/api/v1/chat/recent", out _) ||
            paths.TryGetProperty("/api/v{version}/chat/recent", out _);

        Assert.True(hasSearchRoute, "Expected /api/v1/search (or template equivalent) route in OpenAPI contract.");
        Assert.True(hasFeedRoute, "Expected /api/v1/posts/feed (or template equivalent) route in OpenAPI contract.");
        Assert.True(hasRecentChatRoute, "Expected /api/v1/chat/recent (or template equivalent) route in OpenAPI contract.");
    }
}
