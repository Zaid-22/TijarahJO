using System.IdentityModel.Tokens.Jwt;
using TijarahJo.Api.Common.Authorization;
using TijarahJo.Api.Common.Configuration;
using TijarahJo.Api.Common.Services;
using TijarahJo.Api.Startup;

namespace TijarahJo.Api.Tests;

public sealed class TokenIssuancePrecisionTests
{
    [Fact]
    public void GenerateToken_EmitsPreciseIssuanceClaimAlongsideLegacyIat()
    {
        var service = new TokenService(new JwtOptions
        {
            SigningKey = "UnitTestSigningKey_AtLeast32Chars_Long",
            Issuer = "unit-tests",
            Audience = "unit-tests",
            Lifetime = 60
        });
        long beforeTicks = DateTimeOffset.UtcNow.UtcDateTime.Ticks;

        string encodedToken = service.GenerateToken(7, "user@example.com", "User");

        long afterTicks = DateTimeOffset.UtcNow.UtcDateTime.Ticks;
        JwtSecurityToken token = new JwtSecurityTokenHandler().ReadJwtToken(encodedToken);
        Assert.NotNull(token.Claims.SingleOrDefault(claim => claim.Type == JwtRegisteredClaimNames.Iat));
        long preciseTicks = long.Parse(
            token.Claims.Single(claim => claim.Type == TokenClaimTypes.IssuedAtUtcTicks).Value);
        Assert.InRange(preciseTicks, beforeTicks, afterTicks);
    }

    [Fact]
    public void TryResolveTokenIssuedAt_PrefersPreciseClaimWithinLegacySecond()
    {
        var preciseTime = new DateTimeOffset(
            new DateTime(2026, 8, 9, 12, 0, 0, 750, DateTimeKind.Utc));

        bool resolved = TokenBlacklistMiddleware.TryResolveTokenIssuedAt(
            preciseTime.UtcDateTime.Ticks.ToString(),
            preciseTime.ToUnixTimeSeconds().ToString(),
            out DateTimeOffset issuedAt);

        Assert.True(resolved);
        Assert.Equal(preciseTime, issuedAt);
    }

    [Fact]
    public void TryResolveTokenIssuedAt_FallsBackToLegacyIat()
    {
        long legacySeconds = new DateTimeOffset(
            new DateTime(2026, 8, 9, 12, 0, 0, DateTimeKind.Utc))
            .ToUnixTimeSeconds();

        bool resolved = TokenBlacklistMiddleware.TryResolveTokenIssuedAt(
            issuedAtTicks: null,
            legacyIssuedAtUnixSeconds: legacySeconds.ToString(),
            out DateTimeOffset issuedAt);

        Assert.True(resolved);
        Assert.Equal(legacySeconds, issuedAt.ToUnixTimeSeconds());
    }
}
