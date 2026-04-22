namespace TijarahJo.Api.Common.Configuration;

public sealed class FeatureFlagsOptions
{
    public bool EnableRateLimiting { get; set; } = true;
    public bool EnableHttpLogging { get; set; } = true;
    public bool EnableHealthChecks { get; set; } = true;
    public bool EnableInMemoryCaching { get; set; } = true;
    public bool EnableRedisPresence { get; set; } = true;
    public bool EnableRedisBackplane { get; set; } = true;
    public bool EnableAiComparison { get; set; } = true;
    public bool RequireRedis { get; set; } = false;
}
