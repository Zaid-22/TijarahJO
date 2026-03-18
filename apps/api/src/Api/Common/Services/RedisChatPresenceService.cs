using StackExchange.Redis;
using Microsoft.Extensions.Logging;
using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Api.Common.Services;

public sealed class RedisChatPresenceService : IChatPresenceService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly InMemoryChatPresenceService _fallback;
    private readonly ILogger<RedisChatPresenceService> _logger;
    private static readonly TimeSpan PresenceGracePeriod = TimeSpan.FromSeconds(30);
    private int _redisUnavailableLogged;

    public RedisChatPresenceService(
        IConnectionMultiplexer redis,
        InMemoryChatPresenceService fallback,
        ILogger<RedisChatPresenceService> logger)
    {
        _redis = redis;
        _fallback = fallback;
        _logger = logger;
    }

    private static string GetUserKey(int userId) => $"chat:presence:user:{userId}";
    private static string GetLastSeenKey(int userId) => $"chat:lastseen:user:{userId}";

    public async Task MarkConnectedAsync(int userId, string connectionId, CancellationToken cancellationToken = default)
    {
        if (userId < 1 || string.IsNullOrWhiteSpace(connectionId))
        {
            return;
        }

        await _fallback.MarkConnectedAsync(userId, connectionId, cancellationToken);

        try
        {
            IDatabase db = _redis.GetDatabase();
            await db.SetAddAsync(GetUserKey(userId), connectionId);
            await db.KeyExpireAsync(GetUserKey(userId), TimeSpan.FromHours(24)); // Auto cleanup
            await db.StringSetAsync(GetLastSeenKey(userId), DateTime.UtcNow.ToString("O"));
            MarkRedisHealthy();
        }
        catch (Exception ex) when (IsRedisUnavailable(ex))
        {
            LogRedisUnavailable(ex, nameof(MarkConnectedAsync), userId);
        }
    }

    public async Task MarkDisconnectedAsync(int userId, string connectionId, CancellationToken cancellationToken = default)
    {
        if (userId < 1 || string.IsNullOrWhiteSpace(connectionId))
        {
            return;
        }

        await _fallback.MarkDisconnectedAsync(userId, connectionId, cancellationToken);

        try
        {
            IDatabase db = _redis.GetDatabase();
            await db.SetRemoveAsync(GetUserKey(userId), connectionId);
            await db.StringSetAsync(GetLastSeenKey(userId), DateTime.UtcNow.ToString("O"));
            MarkRedisHealthy();
        }
        catch (Exception ex) when (IsRedisUnavailable(ex))
        {
            LogRedisUnavailable(ex, nameof(MarkDisconnectedAsync), userId);
        }
    }

    public async Task<bool> IsUserOnlineAsync(int userId, CancellationToken cancellationToken = default)
    {
        if (userId < 1)
        {
            return false;
        }

        bool fallbackOnline = await _fallback.IsUserOnlineAsync(userId, cancellationToken);

        try
        {
            IDatabase db = _redis.GetDatabase();
            long connections = await db.SetLengthAsync(GetUserKey(userId));
            if (connections > 0)
            {
                MarkRedisHealthy();
                return true;
            }

            RedisValue lastSeen = await db.StringGetAsync(GetLastSeenKey(userId));
            if (DateTime.TryParse(lastSeen.ToString(), null, System.Globalization.DateTimeStyles.RoundtripKind, out DateTime lastSeenUtc))
            {
                MarkRedisHealthy();
                return DateTime.UtcNow - lastSeenUtc <= PresenceGracePeriod;
            }

            MarkRedisHealthy();
        }
        catch (Exception ex) when (IsRedisUnavailable(ex))
        {
            LogRedisUnavailable(ex, nameof(IsUserOnlineAsync), userId);
        }

        return fallbackOnline;
    }

    public async Task<DateTime?> GetLastSeenUtcAsync(int userId, CancellationToken cancellationToken = default)
    {
        if (userId < 1)
        {
            return null;
        }

        DateTime? fallbackLastSeen = await _fallback.GetLastSeenUtcAsync(userId, cancellationToken);

        try
        {
            IDatabase db = _redis.GetDatabase();
            RedisValue lastSeen = await db.StringGetAsync(GetLastSeenKey(userId));
            if (DateTime.TryParse(lastSeen.ToString(), null, System.Globalization.DateTimeStyles.RoundtripKind, out DateTime resolvedLastSeen))
            {
                MarkRedisHealthy();
                return resolvedLastSeen;
            }

            MarkRedisHealthy();
        }
        catch (Exception ex) when (IsRedisUnavailable(ex))
        {
            LogRedisUnavailable(ex, nameof(GetLastSeenUtcAsync), userId);
        }

        return fallbackLastSeen;
    }

    public async Task<IReadOnlyCollection<string>> GetUserConnectionIdsAsync(int userId, CancellationToken cancellationToken = default)
    {
        if (userId < 1)
        {
            return Array.Empty<string>();
        }

        IReadOnlyCollection<string> fallbackConnections = await _fallback.GetUserConnectionIdsAsync(userId, cancellationToken);

        try
        {
            IDatabase db = _redis.GetDatabase();
            RedisValue[] members = await db.SetMembersAsync(GetUserKey(userId));
            if (members.Length == 0)
            {
                MarkRedisHealthy();
                return fallbackConnections;
            }

            MarkRedisHealthy();
            return members.Select(member => member.ToString()).ToArray();
        }
        catch (Exception ex) when (IsRedisUnavailable(ex))
        {
            LogRedisUnavailable(ex, nameof(GetUserConnectionIdsAsync), userId);
            return fallbackConnections;
        }
    }

    private void LogRedisUnavailable(Exception ex, string operation, int userId)
    {
        if (Interlocked.Exchange(ref _redisUnavailableLogged, 1) == 0)
        {
            _logger.LogWarning(
                ex,
                "Redis chat presence unavailable during {Operation}. Falling back to in-memory presence. userId={UserId}",
                operation,
                userId
            );
        }
        else
        {
            _logger.LogDebug(
                ex,
                "Redis chat presence call failed during {Operation}. userId={UserId}",
                operation,
                userId
            );
        }
    }

    private void MarkRedisHealthy()
    {
        if (Interlocked.Exchange(ref _redisUnavailableLogged, 0) == 1)
        {
            _logger.LogInformation("Redis chat presence connectivity recovered.");
        }
    }

    private static bool IsRedisUnavailable(Exception exception)
    {
        return exception is RedisConnectionException
            or RedisTimeoutException
            or ObjectDisposedException;
    }
}
