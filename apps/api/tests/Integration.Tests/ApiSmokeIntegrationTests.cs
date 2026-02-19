using System.Net;

namespace TijarahJoDBAPI.Integration.Tests;

public sealed class ApiSmokeIntegrationTests
{
    private static bool TryGetBaseUri(out Uri? uri)
    {
        var baseUrl = Environment.GetEnvironmentVariable("BASE_URL");
        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            uri = null;
            return false;
        }

        uri = new Uri(baseUrl, UriKind.Absolute);
        return true;
    }

    [Fact]
    public async Task LegacyPostsAllEndpoint_ReturnsNotFound_WhenBackendIsAvailable()
    {
        if (!TryGetBaseUri(out Uri? baseUri))
        {
            return;
        }

        using var client = new HttpClient
        {
            BaseAddress = baseUri,
            Timeout = TimeSpan.FromSeconds(5)
        };

        HttpResponseMessage response = await client.GetAsync("/api/posts/All");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
