using System.Net;

namespace TijarahJo.Api.Integration.Tests;

public sealed class ApiSmokeIntegrationTests
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
    public async Task LegacyPostsAllEndpoint_ReturnsNotFound_WhenBackendIsAvailable()
    {
        using var client = new HttpClient
        {
            BaseAddress = RequireBaseUri(),
            Timeout = TimeSpan.FromSeconds(5)
        };

        HttpResponseMessage response = await client.GetAsync("/api/posts/All");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task LegacyPostsPaginationEndpoint_ReturnsNotFound_WhenBackendIsAvailable()
    {
        using var client = new HttpClient
        {
            BaseAddress = RequireBaseUri(),
            Timeout = TimeSpan.FromSeconds(5)
        };

        HttpResponseMessage response = await client.GetAsync("/api/posts/pagination?pageNumber=1&rowsPerPage=5&includeDeleted=false");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
