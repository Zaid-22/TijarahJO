using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System;
using System.Security.Claims;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJo.Api.Common.Services;
using TijarahJo.Api.Common.Utils;
using TijarahJo.Api.Contracts.Responses;

namespace TijarahJo.Api.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly IChatOrchestrationService _chat;
        private readonly IChatPresenceService _presence;
        private readonly IChatRealtimeDeliveryService _realtimeDelivery;
        private readonly ILogger<ChatHub> _logger;

        public ChatHub(
            IChatOrchestrationService chat,
            IChatPresenceService presence,
            IChatRealtimeDeliveryService realtimeDelivery,
            ILogger<ChatHub> logger)
        {
            _chat = chat;
            _presence = presence;
            _realtimeDelivery = realtimeDelivery;
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            if (TryGetCurrentUserId(out int userId))
            {
                await _presence.MarkConnectedAsync(userId, Context.ConnectionId, Context.ConnectionAborted);
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (TryGetCurrentUserId(out int userId))
            {
                await _presence.MarkDisconnectedAsync(userId, Context.ConnectionId);
            }

            await base.OnDisconnectedAsync(exception);
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
            if (!TryGetCurrentUserId(out int senderId))
            {
                return;
            }

            CancellationToken cancellationToken = Context.ConnectionAborted;
            ChatServiceResult<SendChatMessageOutcome> result;
            try
            {
                result = await _chat.SendRealtimeMessageAsync(
                    new SendRealtimeChatMessageCommand
                    {
                        SenderUserId = senderId,
                        ReceiverId = receiverIdStr,
                        PostId = postId,
                        Content = content
                    },
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "SignalR send orchestration failed. sender={SenderId}, receiver={ReceiverId}",
                    senderId,
                    receiverIdStr
                );
                await Clients.Caller.SendAsync("MessageError", "Failed to send message.", cancellationToken);
                return;
            }

            if (!result.Success || result.Value is null)
            {
                await Clients.Caller.SendAsync("MessageError", result.Message ?? "Failed to send message.", cancellationToken);
                return;
            }

            SendChatMessageOutcome outcome = result.Value;
            MessageResponseDTO messageDto = DTOMapper.ToMessageResponseDTO(outcome.Message.Message, outcome.ReceiverId, outcome.PostId);
            NotificationResponseDTO? notificationDto = outcome.Notification is null
                ? null
                : DTOMapper.ToNotificationResponseDTO(outcome.Notification);

            await _realtimeDelivery.DeliverToReceiverAsync(
                outcome.ReceiverId,
                messageDto,
                notificationDto,
                cancellationToken);

            await Clients.Caller.SendAsync("MessageSent", ToHubMessagePayload(messageDto), cancellationToken);
        }

        private bool TryGetCurrentUserId(out int userId)
        {
            string? userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                                  ?? Context.User?.FindFirst("id")?.Value;
            return int.TryParse(userIdClaim, out userId);
        }

        private static object ToHubMessagePayload(MessageResponseDTO dto)
        {
            return new
            {
                dto.MessageId,
                dto.SenderId,
                dto.ReceiverId,
                dto.ConversationId,
                dto.Content,
                dto.PostId,
                dto.Timestamp,
                dto.IsRead
            };
        }
    }
}
