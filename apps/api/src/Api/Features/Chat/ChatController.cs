using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Models;
using System;
using System.Collections.Generic;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.DAL.Entities;
using TijarahJoDBAPI.Common.Services;
using TijarahJoDBAPI.Contracts.Requests;
using TijarahJoDBAPI.Common.Utils;
using TijarahJoDBAPI.Contracts.Responses;
using TijarahJoDBAPI.Hubs;

namespace TijarahJoDBAPI.Features.Chat
{
    [Authorize]
    [ApiController]
    [Route("api/chat")]
    [Route("api/v1/chat")]
    public class ChatController : ControllerBase
    {
        private readonly IMessageService _messages;
        private readonly INotificationService _notifications;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly ILogger<ChatController> _logger;

        public ChatController(
            IMessageService messages,
            INotificationService notifications,
            IHubContext<ChatHub> hubContext,
            ILogger<ChatController> logger)
        {
            _messages = messages;
            _notifications = notifications;
            _hubContext = hubContext;
            _logger = logger;
        }

        /// <summary>
        /// Returns the full message history between the authenticated user and another user.
        /// Resolves or creates a Conversation for the pair, then fetches messages by ConversationID.
        /// Also marks all unread messages as read.
        /// </summary>
        [HttpGet("history/{otherUserId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<IEnumerable<MessageResponseDTO>>> GetChatHistory(int otherUserId, CancellationToken cancellationToken)
        {
            if (!ApiControllerHelpers.TryGetCurrentUserId(User, out int currentUserId))
            {
                return Unauthorized();
            }

            if (otherUserId < 1)
            {
                return BadRequest("Invalid chat user ID.");
            }

            int? conversationId = await _messages.GetOrCreateConversationIdAsync(currentUserId, otherUserId, null, cancellationToken);
            if (!conversationId.HasValue)
            {
                return Ok(Array.Empty<MessageResponseDTO>());
            }

            if (!_messages.CanAccessConversation(currentUserId, conversationId.Value))
            {
                return Forbid();
            }

            _messages.MarkAsRead(conversationId.Value, currentUserId);
            await _notifications.MarkConversationAsReadAsync(currentUserId, conversationId.Value, cancellationToken);
            var history = _messages.GetChatHistory(conversationId.Value);
            var response = history
                .Select(message =>
                {
                    int receiverId = message.SenderId == currentUserId ? otherUserId : currentUserId;
                    return DTOMapper.ToMessageResponseDTO(message, receiverId, message.PostId);
                })
                .ToList();
            return Ok(response);
        }

        /// <summary>
        /// Returns the most recent message from each conversation the authenticated user is part of.
        /// </summary>
        [HttpGet("recent")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public ActionResult<IEnumerable<MessageResponseDTO>> GetRecentChats()
        {
            if (!ApiControllerHelpers.TryGetCurrentUserId(User, out int currentUserId))
            {
                return Unauthorized();
            }

            var recentChats = _messages.GetRecentChats(currentUserId);
            var response = recentChats
                .Select(message =>
                {
                    if (!TryResolveReceiverAndPost(currentUserId, message, out int receiverId, out int? postId))
                    {
                        return null;
                    }

                    return DTOMapper.ToMessageResponseDTO(message, receiverId, postId);
                })
                .Where(item => item != null)
                .Cast<MessageResponseDTO>()
                .ToList();

            return Ok(response);
        }

        /// <summary>
        /// Returns the online presence status of another user.
        /// </summary>
        [HttpGet("presence/{otherUserId:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult<PresenceResponseDTO> GetPresence(int otherUserId)
        {
            if (!ApiControllerHelpers.TryGetCurrentUserId(User, out int currentUserId))
            {
                return Unauthorized();
            }

            if (otherUserId < 1)
            {
                return BadRequest("Invalid chat user ID.");
            }

            if (otherUserId == currentUserId)
            {
                return Ok(new PresenceResponseDTO
                {
                    UserId = otherUserId,
                    IsOnline = true,
                    LastSeenAtUtc = DateTime.UtcNow,
                    StatusText = "Online"
                });
            }

            bool isOnline = ChatHub.IsUserOnline(otherUserId.ToString());
            DateTime? lastSeenUtc = null;
            if (!isOnline && ChatHub.TryGetLastSeenUtc(otherUserId.ToString(), out DateTime resolvedLastSeenUtc))
            {
                lastSeenUtc = resolvedLastSeenUtc;
            }

            return Ok(new PresenceResponseDTO
            {
                UserId = otherUserId,
                IsOnline = isOnline,
                LastSeenAtUtc = lastSeenUtc,
                StatusText = isOnline ? "Online" : "Offline"
            });
        }

        /// <summary>
        /// Fallback HTTP endpoint for sending a message if SignalR fails.
        /// The client can supply either ConversationId or ReceiverId.
        /// When ReceiverId is provided, the conversation is resolved/created server-side.
        /// </summary>
        [HttpPost("send")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<MessageResponseDTO>> SendMessage([FromBody] SendChatMessageRequest? request, CancellationToken cancellationToken)
        {
            if (!ApiControllerHelpers.TryGetCurrentUserId(User, out int currentUserId))
            {
                return Unauthorized();
            }

            if (request == null)
            {
                return BadRequest("Message payload is required.");
            }

            if (string.IsNullOrWhiteSpace(request.Content))
            {
                return BadRequest("Message content is required.");
            }

            int conversationId;
            int receiverId;
            int? postId = request.PostId;

            if (request.ConversationId.HasValue && request.ConversationId.Value > 0)
            {
                conversationId = request.ConversationId.Value;
                if (!_messages.CanAccessConversation(currentUserId, conversationId))
                {
                    return Forbid();
                }

                if (!_messages.TryGetConversationMetadata(conversationId, out int user1Id, out int user2Id, out int? conversationPostId))
                {
                    return BadRequest("Conversation not found.");
                }

                receiverId = currentUserId == user1Id
                    ? user2Id
                    : currentUserId == user2Id
                        ? user1Id
                        : 0;

                if (receiverId < 1)
                {
                    return Forbid();
                }

                if (request.ReceiverId.HasValue && request.ReceiverId.Value != receiverId)
                {
                    return BadRequest("ReceiverId does not match ConversationId.");
                }

                postId = conversationPostId;
            }
            else if (request.ReceiverId.HasValue && request.ReceiverId.Value > 0)
            {
                receiverId = request.ReceiverId.Value;
                if (receiverId == currentUserId)
                {
                    return BadRequest("Cannot send a message to yourself.");
                }

                int? resolvedConversationId = await _messages.GetOrCreateConversationIdAsync(currentUserId, receiverId, request.PostId, cancellationToken);
                if (!resolvedConversationId.HasValue)
                {
                    return BadRequest("Failed to resolve conversation.");
                }

                conversationId = resolvedConversationId.Value;
                if (!_messages.CanAccessConversation(currentUserId, conversationId))
                {
                    return Forbid();
                }

                if (_messages.TryGetConversationMetadata(conversationId, out _, out _, out int? conversationPostId))
                {
                    postId = conversationPostId;
                }
            }
            else
            {
                return BadRequest("Either ConversationId or ReceiverId is required.");
            }

            var message = new MessageModel
            {
                MessageId = null,
                SenderId = currentUserId,
                ReceiverId = receiverId,
                PostId = postId,
                ConversationId = conversationId,
                Content = request.Content.Trim(),
                Timestamp = DateTime.UtcNow,
                IsRead = false
            };

            var msg = _messages.Create(message);
            if (await _messages.SaveAsync(msg, cancellationToken))
            {
                var dto = DTOMapper.ToMessageResponseDTO(msg.MessageModel, receiverId, postId);
                NotificationEntity? notification = null;
                try
                {
                    notification = await _notifications.CreateChatMessageNotificationAsync(
                        receiverId,
                        currentUserId,
                        conversationId,
                        msg.MessageModel.MessageId ?? 0,
                        msg.MessageModel.Content,
                        cancellationToken
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(
                        ex,
                        "Failed to create chat notification. sender={SenderId}, receiver={ReceiverId}, conversation={ConversationId}",
                        currentUserId,
                        receiverId,
                        conversationId
                    );
                }

                object? notificationPayload = notification is null
                    ? null
                    : ToRealtimeNotificationPayload(notification);
                var receiverConnections = ChatHub.GetUserConnectionIds(receiverId.ToString());
                if (receiverConnections.Count > 0)
                {
                    var sendTasks = receiverConnections
                        .SelectMany(connectionId =>
                        {
                            var tasks = new List<Task>
                            {
                                _hubContext.Clients.Client(connectionId).SendAsync("ReceiveMessage", dto, cancellationToken)
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

                return Ok(dto);
            }

            return BadRequest("Failed to send message.");
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

        private bool TryResolveReceiverAndPost(int currentUserId, MessageModel message, out int receiverId, out int? postId)
        {
            receiverId = message.ReceiverId ?? 0;
            postId = message.PostId;
            if (receiverId > 0)
            {
                return true;
            }

            if (!_messages.TryGetConversationMetadata(message.ConversationId, out int user1Id, out int user2Id, out int? conversationPostId))
            {
                return false;
            }

            postId ??= conversationPostId;

            if (message.SenderId == currentUserId)
            {
                receiverId = currentUserId == user1Id ? user2Id : user1Id;
            }
            else
            {
                receiverId = currentUserId;
            }

            return receiverId > 0;
        }
    }
}
