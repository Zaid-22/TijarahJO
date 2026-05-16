using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Domain.Entities;
using TijarahJo.Infrastructure.Persistence;

namespace TijarahJo.Infrastructure.Services;

/// <summary>
/// Database-backed token blacklist that survives server restarts.
/// Replaces the in-memory implementation for production resilience.
/// </summary>
public sealed class DatabaseTokenBlacklistService(
    TijarahJoDbContext dbContext,
    ILogger<DatabaseTokenBlacklistService> logger) : ITokenBlacklistService
{
    public async Task AddToBlacklistAsync(string jti, DateTimeOffset expiration, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(jti))
        {
            return;
        }

        bool alreadyExists = await dbContext.BlacklistedTokens
            .AnyAsync(t => t.Jti == jti, cancellationToken);

        if (alreadyExists)
        {
            return;
        }

        dbContext.BlacklistedTokens.Add(new BlacklistedTokenEntity
        {
            Jti = jti,
            ExpiresAt = expiration.UtcDateTime
        });

        await dbContext.SaveChangesAsync(cancellationToken);

        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation("Token {Jti} blacklisted until {Expiration}", jti, expiration);
        }
    }

    public async Task<bool> IsBlacklistedAsync(string jti, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(jti))
        {
            return false;
        }

        return await dbContext.BlacklistedTokens
            .AsNoTracking()
            .AnyAsync(t => t.Jti == jti && t.ExpiresAt > DateTime.UtcNow, cancellationToken);
    }

    /// <summary>
    /// Removes expired entries from the blacklist to prevent unbounded table growth.
    /// Intended to be called periodically via background job.
    /// </summary>
    public async Task<int> PurgeExpiredAsync(CancellationToken cancellationToken = default)
    {
        int deleted = await dbContext.BlacklistedTokens
            .Where(t => t.ExpiresAt <= DateTime.UtcNow)
            .ExecuteDeleteAsync(cancellationToken);

        if (deleted > 0 && logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation("Purged {Count} expired blacklisted tokens", deleted);
        }

        return deleted;
    }

    public async Task InvalidateAllUserSessionsAsync(int userId, CancellationToken cancellationToken = default)
    {
        await dbContext.Users
            .Where(u => u.UserID == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(u => u.LastInvalidatedAt, DateTime.UtcNow), cancellationToken);

        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation("Invalidated all sessions for user {UserId}", userId);
        }
    }

    public async Task<bool> IsUserSessionInvalidatedAsync(int userId, DateTimeOffset tokenIssuedAt, CancellationToken cancellationToken = default)
    {
        var lastInvalidatedAt = await dbContext.Users
            .Where(u => u.UserID == userId)
            .Select(u => u.LastInvalidatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (lastInvalidatedAt.HasValue)
        {
            // If the token was issued before the last invalidation time, it's invalid
            return tokenIssuedAt.UtcDateTime < lastInvalidatedAt.Value;
        }

        return false;
    }
}
