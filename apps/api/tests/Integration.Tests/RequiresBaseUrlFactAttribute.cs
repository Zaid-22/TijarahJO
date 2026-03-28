namespace TijarahJo.Api.Integration.Tests;

internal sealed class RequiresBaseUrlFactAttribute : FactAttribute
{
    private const string LiveBackendRequirementMessage =
        "Live backend HTTP integration tests require BASE_URL to be set " +
        "(for example, BASE_URL=http://localhost:5033).";

    public RequiresBaseUrlFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("BASE_URL")))
        {
            Skip = LiveBackendRequirementMessage;
        }
    }
}
