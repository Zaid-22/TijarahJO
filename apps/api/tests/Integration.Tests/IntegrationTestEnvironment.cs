namespace TijarahJo.Api.Integration.Tests;

internal static class IntegrationTestEnvironment
{
    private const string LiveBackendRequirementMessage =
        "Live backend HTTP integration tests require BASE_URL to be set " +
        "(for example, BASE_URL=http://localhost:5033).";

    public static Uri RequireBaseUri()
    {
        var baseUrl = Environment.GetEnvironmentVariable("BASE_URL");
        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            throw new InvalidOperationException(LiveBackendRequirementMessage);
        }

        return new Uri(baseUrl, UriKind.Absolute);
    }
}
