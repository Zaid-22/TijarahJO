using System.Net;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using TijarahJoDBAPI.Common.Services;

namespace TijarahJoDBAPI.Tests;

public sealed class RateLimitPartitionResolverTests
{
    [Fact]
    public void Resolve_UsesNameIdentifierClaim_ForAuthenticatedUsers()
    {
        var context = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                new[] { new Claim(ClaimTypes.NameIdentifier, "42") },
                authenticationType: "test"))
        };
        context.Connection.RemoteIpAddress = IPAddress.Parse("203.0.113.11");

        string partition = RateLimitPartitionResolver.Resolve(context);

        Assert.Equal("user:42", partition);
    }

    [Fact]
    public void Resolve_FallsBackToIdClaim_WhenNameIdentifierMissing()
    {
        var context = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                new[] { new Claim("id", "7") },
                authenticationType: "test"))
        };

        string partition = RateLimitPartitionResolver.Resolve(context);

        Assert.Equal("user:7", partition);
    }

    [Fact]
    public void Resolve_DoesNotUseSubClaim_ForPartitioning()
    {
        var context = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                new[] { new Claim("sub", "999") },
                authenticationType: "test"))
        };
        context.Connection.RemoteIpAddress = IPAddress.Parse("198.51.100.77");

        string partition = RateLimitPartitionResolver.Resolve(context);

        Assert.Equal("ip:198.51.100.77", partition);
    }

    [Fact]
    public void Resolve_UsesRemoteIp_WhenUserIdClaimIsMissing()
    {
        var context = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity())
        };
        context.Connection.RemoteIpAddress = IPAddress.Parse("198.51.100.9");

        string partition = RateLimitPartitionResolver.Resolve(context);

        Assert.Equal("ip:198.51.100.9", partition);
    }
}
