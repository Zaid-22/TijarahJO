using System.Net;

namespace TijarahJo.Api.Integration.Tests;

public sealed class ApiVersioningIntegrationTests
{
    [RequiresBaseUrlFact]
    public async Task SearchRoute_ReportsSupportedApiVersions()
    {
        using var client = new HttpClient
        {
            BaseAddress = IntegrationTestEnvironment.RequireBaseUri(),
            Timeout = TimeSpan.FromSeconds(8)
        };

        HttpResponseMessage response = await client.GetAsync("/api/v1/search");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(
            response.Headers.TryGetValues("api-supported-versions", out IEnumerable<string>? versions),
            "Expected api-supported-versions response header."
        );
        Assert.Contains("1.0", string.Join(",", versions!));
    }

    [RequiresBaseUrlFact]
    public async Task SearchRoute_WithUnsupportedRouteVersion_ReturnsNotFound()
    {
        using var client = new HttpClient
        {
            BaseAddress = IntegrationTestEnvironment.RequireBaseUri(),
            Timeout = TimeSpan.FromSeconds(8)
        };

        HttpResponseMessage response = await client.GetAsync("/api/v2/search");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [RequiresBaseUrlFact]
    public async Task SearchRoute_WithoutVersionSegment_ReturnsNotFound()
    {
        using var client = new HttpClient
        {
            BaseAddress = IntegrationTestEnvironment.RequireBaseUri(),
            Timeout = TimeSpan.FromSeconds(8)
        };

        HttpResponseMessage response = await client.GetAsync("/api/search");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [RequiresBaseUrlFact]
    public async Task SearchRoute_IgnoresQueryApiVersion_WhenRouteVersionIsProvided()
    {
        using var client = new HttpClient
        {
            BaseAddress = IntegrationTestEnvironment.RequireBaseUri(),
            Timeout = TimeSpan.FromSeconds(8)
        };

        HttpResponseMessage response = await client.GetAsync("/api/v1/search?api-version=2.0");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [RequiresBaseUrlFact]
    public async Task SearchRoute_IgnoresHeaderApiVersion_WhenRouteVersionIsProvided()
    {
        using var client = new HttpClient
        {
            BaseAddress = IntegrationTestEnvironment.RequireBaseUri(),
            Timeout = TimeSpan.FromSeconds(8)
        };

        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/search");
        request.Headers.Add("api-version", "2.0");

        HttpResponseMessage response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [RequiresBaseUrlFact]
    public async Task SearchRoute_V1Alias_ReturnsOk()
    {
        using var client = new HttpClient
        {
            BaseAddress = IntegrationTestEnvironment.RequireBaseUri(),
            Timeout = TimeSpan.FromSeconds(8)
        };

        HttpResponseMessage response = await client.GetAsync("/api/v1/search");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [RequiresBaseUrlFact]
    public async Task TopSellersRoute_V1Alias_ReturnsOk()
    {
        using var client = new HttpClient
        {
            BaseAddress = IntegrationTestEnvironment.RequireBaseUri(),
            Timeout = TimeSpan.FromSeconds(8)
        };

        HttpResponseMessage response = await client.GetAsync("/api/v1/sellers/top?take=5");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
