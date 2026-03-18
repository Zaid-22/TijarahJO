using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJo.Api.Contracts.Responses;
using TijarahJo.Api.Hubs;

namespace TijarahJo.Api.Common.Services;

public interface IChatPresenceService : IChatPresenceLookup
{
    Task MarkConnectedAsync(int userId, string connectionId, CancellationToken cancellationToken = default);
    Task MarkDisconnectedAsync(int userId, string connectionId, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<string>> GetUserConnectionIdsAsync(int userId, CancellationToken cancellationToken = default);
}

public interface IChatRealtimeDeliveryService
{
    Task DeliverToReceiverAsync(
        int receiverUserId,
        MessageResponseDTO messagePayload,
        NotificationResponseDTO? notificationPayload,
        CancellationToken cancellationToken = default);
}

public sealed class InMemoryChatPresenceService : IChatPresenceService
{
    private static readonly TimeSpan PresenceGracePeriod = TimeSpan.FromSeconds(30);
    private readonly ConcurrentDictionary<int, ConcurrentDictionary<string, byte>> _userConnections = new();
    private readonly ConcurrentDictionary<int, DateTime> _userLastSeenUtc = new();

    public Task MarkConnectedAsync(int userId, string connectionId, CancellationToken cancellationToken = default)
    {
        if (userId < 1 || string.IsNullOrWhiteSpace(connectionId))
        {
            return Task.CompletedTask;
        }

        ConcurrentDictionary<string, byte> connections = _userConnections.GetOrAdd(
            userId,
            _ => new ConcurrentDictionary<string, byte>());
        connections.TryAdd(connectionId, 0);
        _userLastSeenUtc[userId] = DateTime.UtcNow;
        return Task.CompletedTask;
    }

    public Task MarkDisconnectedAsync(int userId, string connectionId, CancellationToken cancellationToken = default)
    {
        if (userId < 1 || string.IsNullOrWhiteSpace(connectionId))
        {
            return Task.CompletedTask;
        }

        if (_userConnections.TryGetValue(userId, out ConcurrentDictionary<string, byte>? connections))
        {
            connections.TryRemove(connectionId, out _);
            if (connections.IsEmpty)
            {
                _userConnections.TryRemove(userId, out _);
            }
        }

        _userLastSeenUtc[userId] = DateTime.UtcNow;
        return Task.CompletedTask;
    }

    public Task<bool> IsUserOnlineAsync(int userId, CancellationToken cancellationToken = default)
    {
        if (userId < 1)
        {
            return Task.FromResult(false);
        }

        if (_userConnections.TryGetValue(userId, out ConcurrentDictionary<string, byte>? connections) &&
            !connections.IsEmpty)
        {
            return Task.FromResult(true);
        }

        if (_userLastSeenUtc.TryGetValue(userId, out DateTime lastSeenUtc))
        {
            return Task.FromResult(DateTime.UtcNow - lastSeenUtc <= PresenceGracePeriod);
        }

        return Task.FromResult(false);
    }

    public Task<DateTime?> GetLastSeenUtcAsync(int userId, CancellationToken cancellationToken = default)
    {
        if (userId < 1)
        {
            return Task.FromResult<DateTime?>(null);
        }

        return Task.FromResult(
            _userLastSeenUtc.TryGetValue(userId, out DateTime lastSeenUtc)
                ? (DateTime?)lastSeenUtc
                : null
        );
    }

    public Task<IReadOnlyCollection<string>> GetUserConnectionIdsAsync(int userId, CancellationToken cancellationToken = default)
    {
        if (userId < 1)
        {
            return Task.FromResult<IReadOnlyCollection<string>>(Array.Empty<string>());
        }

        if (!_userConnections.TryGetValue(userId, out ConcurrentDictionary<string, byte>? connections) ||
            connections.IsEmpty)
        {
            return Task.FromResult<IReadOnlyCollection<string>>(Array.Empty<string>());
        }

        return Task.FromResult<IReadOnlyCollection<string>>(connections.Keys.ToArray());
    }
}

public sealed class ChatRealtimeDeliveryService : IChatRealtimeDeliveryService
{
    private readonly IHubContext<ChatHub> _hubContext;
    private readonly IChatPresenceService _presence;

    public ChatRealtimeDeliveryService(IHubContext<ChatHub> hubContext, IChatPresenceService presence)
    {
        _hubContext = hubContext;
        _presence = presence;
    }

    public async Task DeliverToReceiverAsync(
        int receiverUserId,
        MessageResponseDTO messagePayload,
        NotificationResponseDTO? notificationPayload,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyCollection<string> receiverConnections = await _presence.GetUserConnectionIdsAsync(receiverUserId, cancellationToken);
        if (receiverConnections.Count == 0)
        {
            return;
        }

        IEnumerable<Task> sendTasks = receiverConnections.SelectMany(connectionId =>
        {
            var tasks = new List<Task>
            {
                _hubContext.Clients.Client(connectionId).SendAsync(
                    "ReceiveMessage",
                    messagePayload,
                    cancellationToken)
            };

            if (notificationPayload is not null)
            {
                tasks.Add(_hubContext.Clients.Client(connectionId).SendAsync(
                    "ReceiveNotification",
                    notificationPayload,
                    cancellationToken));
            }

            return tasks;
        });

        await Task.WhenAll(sendTasks);
    }
}
