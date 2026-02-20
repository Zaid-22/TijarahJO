using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using Models;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using TijarahJoDB.DAL.Entities;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDBAPI.Common.Services;

namespace TijarahJoDBAPI.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly IMessageService _messages;
        private readonly INotificationService _notifications;
        private readonly ILogger<ChatHub> _logger;

        public ChatHub(
            IMessageService messages,
            INotificationService notifications,
            ILogger<ChatHub> logger)
        {
            _messages = messages;
            _notifications = notifications;
            _logger = logger;
        }

        // In-memory presence store keyed by user ID then connection IDs.
        // For production/distributed deployments, replace with Redis.
        private static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, byte>> UserConnections = new();
        private static readonly ConcurrentDictionary<string, DateTime> UserLastSeenUtc = new();
        private static readonly TimeSpan PresenceGracePeriod = TimeSpan.FromSeconds(30);

        public override Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                      ?? Context.User?.FindFirst("id")?.Value;
            if (userId != null)
            {
                var connections = UserConnections.GetOrAdd(
                    userId,
                    _ => new ConcurrentDictionary<string, byte>()
                );
                connections.TryAdd(Context.ConnectionId, 0);
                UserLastSeenUtc[userId] = DateTime.UtcNow;
            }
            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                      ?? Context.User?.FindFirst("id")?.Value;
            if (userId != null)
            {
                if (UserConnections.TryGetValue(userId, out var connections))
                {
                    connections.TryRemove(Context.ConnectionId, out _);
                    if (connections.IsEmpty)
                    {
                        UserConnections.TryRemove(userId, out _);
                    }
                }

                UserLastSeenUtc[userId] = DateTime.UtcNow;
            }
            return base.OnDisconnectedAsync(exception);
        }

        /// <summary>Returns true if the given user ID has at least one active SignalR connection.</summary>
        public static bool IsUserOnline(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                return false;
            }

            if (UserConnections.TryGetValue(userId, out var connections) && !connections.IsEmpty)
            {
                return true;
            }

            if (UserLastSeenUtc.TryGetValue(userId, out DateTime lastSeenUtc))
            {
                return DateTime.UtcNow - lastSeenUtc <= PresenceGracePeriod;
            }

            return false;
        }

        public static bool TryGetLastSeenUtc(string userId, out DateTime lastSeenUtc)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                lastSeenUtc = default;
                return false;
            }

            return UserLastSeenUtc.TryGetValue(userId, out lastSeenUtc);
        }

        public static IReadOnlyCollection<string> GetUserConnectionIds(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Array.Empty<string>();
            }

            if (!UserConnections.TryGetValue(userId, out var connections) || connections.IsEmpty)
            {
                return Array.Empty<string>();
            }

            return connections.Keys.ToArray();
        }

        /// <summary>
        /// SignalR endpoint for real-time messaging.
        ///
        /// Flow:
        ///   1. Resolve or create the Conversation for the (sender, receiver, postId) pair.
        ///   2. Persist the message immediately under that ConversationID.
        ///   3. Push "ReceiveMessage" to the receiver's active connections.
        ///   4. Push "MessageSent" back to the sender so the UI can update optimistically.
        ///
        /// Parameters conform to the conversation-centric schema introduced in V202602191110.
        /// </summary>
        public async Task SendMessage(string receiverIdStr, string content, int? postId)
        {
            var senderIdStr = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? Context.User?.FindFirst("id")?.Value;

            if (senderIdStr == null) return;
            if (string.IsNullOrWhiteSpace(receiverIdStr)) return;
            if (senderIdStr == receiverIdStr) return;

            content = content?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(content)) return;

            if (!int.TryParse(senderIdStr, out int senderId) ||
                !int.TryParse(receiverIdStr, out int receiverId))
            {
                return;
            }

            var timestamp = DateTime.UtcNow;
            CancellationToken cancellationToken = Context.ConnectionAborted;

            // Step 1: Resolve or create the Conversation (canonical: smaller ID = User1)
            int? conversationId = await _messages.GetOrCreateConversationIdAsync(senderId, receiverId, postId, cancellationToken);
            if (!conversationId.HasValue)
            {
                // Could not persist conversation — abort silently (prevents data loss)
                return;
            }

            // Step 2: Persist message first. Do not emit realtime events for data that failed to persist.
            int persistedMessageId;
            try
            {
                MessageModel messageModel = new(null, senderId, conversationId.Value, content, timestamp, false, receiverId, postId);
                var message = _messages.Create(messageModel);
                if (!await _messages.SaveAsync(message, cancellationToken))
                {
                    await Clients.Caller.SendAsync("MessageError", "Failed to persist message.");
                    return;
                }

                persistedMessageId = message.MessageModel.MessageId ?? 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to persist SignalR message. sender={SenderId}, receiver={ReceiverId}, conversation={ConversationId}",
                    senderId,
                    receiverId,
                    conversationId.Value
                );
                await Clients.Caller.SendAsync("MessageError", "Failed to persist message.");
                return;
            }

            var payload = new
            {
                MessageId = persistedMessageId,
                SenderId = senderId,
                ReceiverId = receiverId,
                ConversationId = conversationId.Value,
                Content = content,
                PostId = postId,
                Timestamp = timestamp,
                IsRead = false
            };

            NotificationEntity? notification = null;
            try
            {
                notification = await _notifications.CreateChatMessageNotificationAsync(
                    receiverId,
                    senderId,
                    conversationId.Value,
                    persistedMessageId,
                    content,
                    cancellationToken
                );
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Failed to create notification for receiver={ReceiverId}, sender={SenderId}, conversation={ConversationId}, message={MessageId}",
                    receiverId,
                    senderId,
                    conversationId.Value,
                    persistedMessageId
                );
            }

            object? notificationPayload = notification is null
                ? null
                : ToRealtimeNotificationPayload(notification);

            // Step 3: Push to receiver's active connections
            if (UserConnections.TryGetValue(receiverIdStr, out var receiverConnections) &&
                !receiverConnections.IsEmpty)
            {
                var sendTasks = receiverConnections.Keys
                    .SelectMany(connectionId =>
                    {
                        var tasks = new List<Task>
                        {
                            Clients.Client(connectionId).SendAsync(
                                "ReceiveMessage",
                                payload,
                                cancellationToken)
                        };

                        if (notificationPayload is not null)
                        {
                            tasks.Add(Clients.Client(connectionId).SendAsync(
                                "ReceiveNotification",
                                notificationPayload,
                                cancellationToken));
                        }

                        return tasks;
                    });
                await Task.WhenAll(sendTasks);
            }

            // Step 4: Echo back to sender
            await Clients.Caller.SendAsync(
                "MessageSent",
                payload
            );
        }

        private static object ToRealtimeNotificationPayload(NotificationEntity notification)
        {
            return new
            {
                NotificationId = notification.NotificationID,
                NotificationType = notification.NotificationType,
                Title = notification.Title,
                Body = notification.Body,
                SenderUserId = notification.SenderUserID,
                ConversationId = notification.ConversationID,
                MessageId = notification.MessageID,
                RouteUrl = notification.RouteUrl,
                IsRead = notification.IsRead,
                CreatedAt = notification.CreatedAt,
                ReadAt = notification.ReadAt
            };
        }
    }
}
