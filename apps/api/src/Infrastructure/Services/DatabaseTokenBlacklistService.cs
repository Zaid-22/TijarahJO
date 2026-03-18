using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.DAL.Entities;
using TijarahJoDB.DAL.Persistence;

namespace TijarahJo.Infrastructure.Services;

/// <summary>
/// Database-backed token blacklist that survives server restarts.
/// Replaces the in-memory implementation for production resilience.
/// </summary>
public sealed class DatabaseTokenBlacklistService : ITokenBlacklistService
{
    private readonly TijarahJoDbContext _dbContext;
    private readonly ILogger<DatabaseTokenBlacklistService> _logger;

    public DatabaseTokenBlacklistService(
        TijarahJoDbContext dbContext,
        ILogger<DatabaseTokenBlacklistService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task AddToBlacklistAsync(string jti, DateTimeOffset expiration, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(jti))
        {
            return;
        }

        bool alreadyExists = await _dbContext.BlacklistedTokens
            .AnyAsync(t => t.Jti == jti, cancellationToken);

        if (alreadyExists)
        {
            return;
        }

        _dbContext.BlacklistedTokens.Add(new BlacklistedTokenEntity
        {
            Jti = jti,
            ExpiresAt = expiration.UtcDateTime
        });

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Token {Jti} blacklisted until {Expiration}", jti, expiration);
    }

    public async Task<bool> IsBlacklistedAsync(string jti, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(jti))
        {
            return false;
        }

        return await _dbContext.BlacklistedTokens
            .AsNoTracking()
            .AnyAsync(t => t.Jti == jti && t.ExpiresAt > DateTime.UtcNow, cancellationToken);
    }

    /// <summary>
    /// Removes expired entries from the blacklist to prevent unbounded table growth.
    /// Intended to be called periodically via background job.
    /// </summary>
    public async Task<int> PurgeExpiredAsync(CancellationToken cancellationToken = default)
    {
        int deleted = await _dbContext.BlacklistedTokens
            .Where(t => t.ExpiresAt <= DateTime.UtcNow)
            .ExecuteDeleteAsync(cancellationToken);

        if (deleted > 0)
        {
            _logger.LogInformation("Purged {Count} expired blacklisted tokens", deleted);
        }

        return deleted;
    }
}
