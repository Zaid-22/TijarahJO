using System.Net;
using System.Net.Sockets;
using TijarahJo.Api.Common.Utils;

namespace TijarahJo.Api.Common.Services;

public static class RateLimitPartitionResolver
{
    public static string Resolve(HttpContext httpContext)
    {
        if (ApiControllerHelpers.TryGetCurrentUserId(httpContext.User, out int userId))
        {
            return $"user:{userId}";
        }

        string? clientIp = ResolveClientIp(httpContext);
        return string.IsNullOrWhiteSpace(clientIp) ? "ip:unknown" : $"ip:{clientIp}";
    }

    internal static string? ResolveClientIp(HttpContext httpContext)
    {
        IPAddress? remoteIp = httpContext.Connection.RemoteIpAddress;
        if (remoteIp is not null && !IsPrivateOrLoopback(remoteIp))
        {
            return NormalizeIp(remoteIp);
        }

        string? forwardedClientIp = TryReadForwardedClientIp(httpContext);
        if (!string.IsNullOrWhiteSpace(forwardedClientIp))
        {
            return forwardedClientIp;
        }

        return remoteIp is null ? null : NormalizeIp(remoteIp);
    }

    private static string? TryReadForwardedClientIp(HttpContext httpContext)
    {
        string? realIp = httpContext.Request.Headers["X-Real-IP"].FirstOrDefault();
        if (TryNormalizeIpString(realIp, out string? normalizedRealIp))
        {
            return normalizedRealIp;
        }

        string? forwardedFor = httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(forwardedFor))
        {
            return null;
        }

        // Left-most address is the original client (de-facto convention behind reverse proxies).
        string firstHop = forwardedFor.Split(',')[0].Trim();
        return TryNormalizeIpString(firstHop, out string? normalized) ? normalized : null;
    }

    private static bool TryNormalizeIpString(string? rawValue, out string? normalized)
    {
        normalized = null;
        if (string.IsNullOrWhiteSpace(rawValue))
        {
            return false;
        }

        if (!IPAddress.TryParse(rawValue, out IPAddress? address))
        {
            return false;
        }

        normalized = NormalizeIp(address);
        return true;
    }

    private static string NormalizeIp(IPAddress address)
    {
        if (address.IsIPv4MappedToIPv6)
        {
            address = address.MapToIPv4();
        }

        return address.ToString();
    }

    private static bool IsPrivateOrLoopback(IPAddress address)
    {
        if (IPAddress.IsLoopback(address))
        {
            return true;
        }

        if (address.IsIPv4MappedToIPv6)
        {
            address = address.MapToIPv4();
        }

        if (address.AddressFamily != AddressFamily.InterNetwork)
        {
            return false;
        }

        byte[] bytes = address.GetAddressBytes();
        if (bytes[0] == 10)
        {
            return true;
        }

        if (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31)
        {
            return true;
        }

        if (bytes[0] == 192 && bytes[1] == 168)
        {
            return true;
        }

        if (bytes[0] == 169 && bytes[1] == 254)
        {
            return true;
        }

        return false;
    }
}
