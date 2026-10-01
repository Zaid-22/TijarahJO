using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;
using TijarahJo.Application.Abstractions.Services;
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

    Task DeliverReadReceiptAsync(
        int senderUserId,
        int conversationId,
        int readerUserId,
        int lastReadMessageId,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// In-memory chat presence tracker using ConcurrentDictionary.
/// WARNING: This only works in single-server deployments. For horizontal
/// scaling, replace with Redis-backed presence (EnableRedisPresence feature flag).
/// </summary>
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
            return Task.FromResult<IReadOnlyCollection<string>>([]);
        }

        if (!_userConnections.TryGetValue(userId, out ConcurrentDictionary<string, byte>? connections) ||
            connections.IsEmpty)
        {
            return Task.FromResult<IReadOnlyCollection<string>>([]);
        }

        return Task.FromResult<IReadOnlyCollection<string>>([.. connections.Keys]);
    }
}

public sealed class ChatRealtimeDeliveryService(
    IHubContext<ChatHub> hubContext,
    IChatPresenceService presence) : IChatRealtimeDeliveryService
{

    public async Task DeliverToReceiverAsync(
        int receiverUserId,
        MessageResponseDTO messagePayload,
        NotificationResponseDTO? notificationPayload,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyCollection<string> receiverConnections = await presence.GetUserConnectionIdsAsync(receiverUserId, cancellationToken);
        if (receiverConnections.Count == 0)
        {
            return;
        }

        IEnumerable<Task> sendTasks = receiverConnections.SelectMany(connectionId =>
        {
            var tasks = new List<Task>
            {
                hubContext.Clients.Client(connectionId).SendAsync(
                    "ReceiveMessage",
                    messagePayload,
                    cancellationToken)
            };

            if (notificationPayload is not null)
            {
                tasks.Add(hubContext.Clients.Client(connectionId).SendAsync(
                    "ReceiveNotification",
                    notificationPayload,
                    cancellationToken));
            }

            return tasks;
        });

        await Task.WhenAll(sendTasks);
    }

    public async Task DeliverReadReceiptAsync(
        int senderUserId,
        int conversationId,
        int readerUserId,
        int lastReadMessageId,
        CancellationToken cancellationToken = default)
    {
        if (lastReadMessageId < 1)
        {
            return;
        }

        IReadOnlyCollection<string> senderConnections = await presence.GetUserConnectionIdsAsync(senderUserId, cancellationToken);
        if (senderConnections.Count == 0)
        {
            return;
        }

        IEnumerable<Task> sendTasks = senderConnections.Select(connectionId =>
            hubContext.Clients.Client(connectionId).SendAsync(
                "MessagesRead",
                new
                {
                    ConversationId = conversationId,
                    ReaderUserId = readerUserId,
                    LastReadMessageId = lastReadMessageId
                },
                cancellationToken));

        await Task.WhenAll(sendTasks);
    }
}
