using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using Models;
using System.Collections.Concurrent;
using System.Linq;
using System.Security.Claims;
using TijarahJoDB.Application.Abstractions.Services;

namespace TijarahJoDBAPI.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly IMessageService _messages;

        public ChatHub(IMessageService messages)
        {
            _messages = messages;
        }

        // In-memory presence store keyed by user ID then connection IDs.
        // For production/distributed deployments, replace with Redis.
        private static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, byte>> UserConnections = new();

        public override Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Context.User?.FindFirst("id")?.Value;
            if (userId != null)
            {
                var connections = UserConnections.GetOrAdd(
                    userId,
                    _ => new ConcurrentDictionary<string, byte>()
                );
                connections.TryAdd(Context.ConnectionId, 0);
            }
            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Context.User?.FindFirst("id")?.Value;
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
            }
            return base.OnDisconnectedAsync(exception);
        }

        public static bool IsUserOnline(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                return false;
            }

            return UserConnections.TryGetValue(userId, out var connections) && !connections.IsEmpty;
        }

        public async Task SendMessage(string receiverId, string content, int? postId)
        {
            var senderId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Context.User?.FindFirst("id")?.Value;
            
            if (senderId == null) return;
            if (string.IsNullOrWhiteSpace(receiverId)) return;
            if (senderId == receiverId) return;

            content = content?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(content)) return;

            var timestamp = DateTime.UtcNow;

            // Send to receiver if connected
            if (UserConnections.TryGetValue(receiverId, out var receiverConnections) && !receiverConnections.IsEmpty)
            {
                var sendTasks = receiverConnections.Keys
                    .Select(connectionId =>
                        Clients.Client(connectionId).SendAsync("ReceiveMessage", senderId, content, postId, timestamp)
                    );

                await Task.WhenAll(sendTasks);
            }

            // Also send back to sender so they see it immediately (or handling in frontend)
            await Clients.Caller.SendAsync("MessageSent", receiverId, content, postId, timestamp);

            // Save to Database
            if (int.TryParse(senderId, out int sid) && int.TryParse(receiverId, out int rid))
            {
                try
                {
                    MessageModel messageModel = new(null, sid, rid, postId, content, timestamp, false);
                    var message = _messages.Create(messageModel);
                    _messages.Save(message);
                }
                catch
                {
                    // Keep realtime delivery resilient even if persistence fails.
                }
            }
        }
    }
}
