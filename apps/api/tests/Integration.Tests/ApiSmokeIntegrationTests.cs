using System.Net;

namespace TijarahJo.Api.Integration.Tests;

public sealed class ApiSmokeIntegrationTests
{
    [RequiresBaseUrlFact]
    public async Task LegacyPostsAllEndpoint_ReturnsNotFound_WhenBackendIsAvailable()
    {
        using var client = new HttpClient
        {
            BaseAddress = IntegrationTestEnvironment.RequireBaseUri(),
            Timeout = TimeSpan.FromSeconds(5)
        };

        HttpResponseMessage response = await client.GetAsync("/api/posts/All");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [RequiresBaseUrlFact]
    public async Task LegacyPostsPaginationEndpoint_ReturnsNotFound_WhenBackendIsAvailable()
    {
        using var client = new HttpClient
        {
            BaseAddress = IntegrationTestEnvironment.RequireBaseUri(),
            Timeout = TimeSpan.FromSeconds(5)
        };

        HttpResponseMessage response = await client.GetAsync("/api/posts/pagination?pageNumber=1&rowsPerPage=5&includeDeleted=false");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
