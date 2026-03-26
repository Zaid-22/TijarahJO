namespace TijarahJo.Application.Abstractions.Services;

/// <summary>
/// Manages revoked JWT tokens so that logged-out users cannot reuse their token.
/// </summary>
public interface ITokenBlacklistService
{
    /// <summary>Add a JTI to the blacklist until its natural expiration.</summary>
    Task AddToBlacklistAsync(string jti, DateTimeOffset expiration, CancellationToken cancellationToken = default);

    /// <summary>Check whether a JTI has been blacklisted.</summary>
    Task<bool> IsBlacklistedAsync(string jti, CancellationToken cancellationToken = default);

    /// <summary>Invalidate all sessions for a user, usually after a password reset.</summary>
    Task InvalidateAllUserSessionsAsync(int userId, CancellationToken cancellationToken = default);

    /// <summary>Check if a user session was invalidated after the token was issued.</summary>
    Task<bool> IsUserSessionInvalidatedAsync(int userId, DateTimeOffset tokenIssuedAt, CancellationToken cancellationToken = default);
}
