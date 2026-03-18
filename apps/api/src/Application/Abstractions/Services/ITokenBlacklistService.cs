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
}
