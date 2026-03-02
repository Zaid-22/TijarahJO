using TijarahJoDBAPI.Common.Utils;

namespace TijarahJoDBAPI.Common.Services;

public static class RateLimitPartitionResolver
{
    public static string Resolve(HttpContext httpContext)
    {
        if (ApiControllerHelpers.TryGetCurrentUserId(httpContext.User, out int userId))
        {
            return $"user:{userId}";
        }

        string? remoteIp = httpContext.Connection.RemoteIpAddress?.ToString();
        if (!string.IsNullOrWhiteSpace(remoteIp))
        {
            return $"ip:{remoteIp}";
        }

        return "ip:unknown";
    }
}
