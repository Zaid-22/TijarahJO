using StackExchange.Redis;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Api.Common.Configuration;
using TijarahJo.Api.Common.Services;

namespace TijarahJo.Api.Startup;

/// <summary>
/// Result of the Redis startup connection attempt, passed to the middleware pipeline
/// to configure runtime services (presence, backplane) accordingly.
/// </summary>
public sealed class RedisStartupResult
{
    public IConnectionMultiplexer? Connection { get; init; }
    public Exception? StartupException { get; init; }
    public bool PresenceEnabled { get; init; }
    public bool BackplaneEnabled { get; init; }
    public bool Required { get; init; }
    public bool Requested => PresenceEnabled || BackplaneEnabled;
}

public static class RedisExtensions
{
    private static readonly TimeSpan StartupConnectTimeout = TimeSpan.FromSeconds(3);
    public static async Task<RedisStartupResult> AddTijarahJoRedis(
        this IServiceCollection services,
        IConfiguration configuration,
        FeatureFlagsOptions featureFlags)
    {
        string redisConnectionString = configuration.GetConnectionString("Redis") ?? "localhost:6379";
        bool redisPresenceEnabled = featureFlags.EnableRedisPresence;
        bool redisBackplaneEnabled = featureFlags.EnableRedisBackplane;
        bool redisRequired = featureFlags.RequireRedis;
        bool redisRequested = redisPresenceEnabled || redisBackplaneEnabled;

        IConnectionMultiplexer? redisConnection = null;
        Exception? redisStartupException = null;

        if (redisRequested)
        {
            try
            {
                var redisOptions = ConfigurationOptions.Parse(redisConnectionString, ignoreUnknown: true);
                redisOptions.AbortOnConnectFail = false;
                redisOptions.ConnectRetry = Math.Max(redisOptions.ConnectRetry, 1);
                redisOptions.ConnectTimeout = Math.Min(redisOptions.ConnectTimeout <= 0 ? 2000 : redisOptions.ConnectTimeout, 2000);
                redisOptions.SyncTimeout = Math.Min(redisOptions.SyncTimeout <= 0 ? 2000 : redisOptions.SyncTimeout, 2000);

                Task<ConnectionMultiplexer> connectTask = ConnectionMultiplexer.ConnectAsync(redisOptions);
                Task completedTask = await Task.WhenAny(connectTask, Task.Delay(StartupConnectTimeout));
                if (completedTask != connectTask)
                {
                    throw new TimeoutException("Redis startup connection timed out after 3 seconds.");
                }

                redisConnection = await connectTask;
                if (!redisConnection.IsConnected)
                {
                    throw new RedisConnectionException(
                        ConnectionFailureType.UnableToConnect,
                        "Redis connection was created but no server connection is active.");
                }
            }
            catch (Exception ex)
            {
                redisStartupException = ex;
                redisConnection?.Dispose();
                redisConnection = null;

                if (redisRequired)
                {
                    throw new InvalidOperationException(
                        "Redis is required by configuration but is unavailable at startup.",
                        ex
                    );
                }
            }
        }

        if (redisConnection is not null)
        {
            services.AddSingleton<IConnectionMultiplexer>(redisConnection);
        }

        if (redisPresenceEnabled && redisConnection is not null)
        {
            services.AddSingleton<IChatPresenceService, RedisChatPresenceService>();
        }
        else
        {
            services.AddSingleton<IChatPresenceService>(sp => sp.GetRequiredService<InMemoryChatPresenceService>());
        }

        services.AddSingleton<IChatPresenceLookup>(sp => sp.GetRequiredService<IChatPresenceService>());
        services.AddSingleton<IChatRealtimeDeliveryService, ChatRealtimeDeliveryService>();

        // Register SignalR with optional Redis backplane.
        var signalRBuilder = services.AddSignalR();
        if (redisBackplaneEnabled && redisConnection is not null)
        {
            signalRBuilder.AddStackExchangeRedis(redisConnectionString);
        }

        if (redisConnection is not null)
        {
            services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = configuration.GetConnectionString("Redis") ?? "localhost:6379";
                options.InstanceName = "TijarahJo_";
            });
        }
        else
        {
            services.AddDistributedMemoryCache();
        }

        return new RedisStartupResult
        {
            Connection = redisConnection,
            StartupException = redisStartupException,
            PresenceEnabled = redisPresenceEnabled,
            BackplaneEnabled = redisBackplaneEnabled,
            Required = redisRequired
        };
    }

    public static void LogRedisStartupStatus(this WebApplication app, RedisStartupResult result)
    {
        if (result.Requested && result.Connection is null)
        {
            app.Logger.LogWarning(
                result.StartupException,
                "Redis is unavailable at startup. Running in degraded mode. presenceRedisEnabled={PresenceEnabled}, backplaneRedisEnabled={BackplaneEnabled}",
                result.PresenceEnabled,
                result.BackplaneEnabled
            );
        }
        else if (result.Connection is not null)
        {
            app.Logger.LogInformation(
                "Redis realtime integration enabled. presenceRedisEnabled={PresenceEnabled}, backplaneRedisEnabled={BackplaneEnabled}",
                result.PresenceEnabled,
                result.BackplaneEnabled
            );
        }
    }
}
