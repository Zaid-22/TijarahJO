using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Application.Services;

public sealed class ChatOrchestrationService(
    IMessageService messages,
    INotificationService notifications,
    IChatPresenceLookup presenceLookup,
    IUserQueryHandler userQueryHandler)
    : IChatOrchestrationService
{
    private const int MaxMessageContentLength = 4000;
    private const string ChatImagePrefix = "[chat-image]";

    private readonly IMessageService _messages = messages;
    private readonly INotificationService _notifications = notifications;
    private readonly IChatPresenceLookup _presenceLookup = presenceLookup;
    private readonly IUserQueryHandler _userQueryHandler = userQueryHandler;

    public async Task<ChatServiceResult<IReadOnlyList<ChatMessageEnvelope>>> GetHistoryAsync(
        int currentUserId,
        int otherUserId,
        CancellationToken cancellationToken = default
    )
    {
        if (currentUserId < 1 || otherUserId < 1)
        {
            return Failure<IReadOnlyList<ChatMessageEnvelope>>(ChatFailureReason.InvalidRequest, "Invalid chat user ID.");
        }

        IReadOnlyList<int> conversationIds = await _messages.GetConversationIdsBetweenUsersAsync(
            currentUserId, otherUserId, cancellationToken);
        await _messages.MarkAsReadBetweenUsersAsync(currentUserId, otherUserId, cancellationToken);
        IReadOnlyList<MessageModel> messages = await _messages.GetChatHistoryBetweenUsersAsync(
            currentUserId, otherUserId, cancellationToken: cancellationToken);

        foreach (int conversationId in conversationIds)
        {
            await _notifications.MarkConversationAsReadAsync(
                currentUserId, conversationId, cancellationToken);
        }

        IReadOnlyList<ChatMessageEnvelope> history = [.. messages
            .Select(message => new ChatMessageEnvelope
            {
                Message = message,
                ReceiverId = message.SenderId == currentUserId ? otherUserId : currentUserId,
                PostId = message.PostId
            })];

        return new ChatServiceResult<IReadOnlyList<ChatMessageEnvelope>>
        {
            Success = true,
            Value = history
        };
    }

    public async Task<ChatServiceResult<IReadOnlyList<ChatMessageEnvelope>>> GetRecentChatsAsync(
        int currentUserId,
        CancellationToken cancellationToken = default
    )
    {
        if (currentUserId < 1)
        {
            return Failure<IReadOnlyList<ChatMessageEnvelope>>(ChatFailureReason.InvalidRequest, "Invalid user identifier.");
        }

        List<MessageModel> recentMessages = await _messages.GetRecentChatsAsync(currentUserId, cancellationToken);
        var recent = new List<ChatMessageEnvelope>(recentMessages.Count);
        foreach (MessageModel message in recentMessages)
        {
            (bool resolved, int receiverId, int? postId) = await TryResolveReceiverAndPostAsync(
                currentUserId,
                message,
                cancellationToken
            );
            if (!resolved)
            {
                continue;
            }

            recent.Add(new ChatMessageEnvelope
            {
                Message = message,
                ReceiverId = receiverId,
                PostId = postId
            });
        }

        return new ChatServiceResult<IReadOnlyList<ChatMessageEnvelope>>
        {
            Success = true,
            Value = recent
        };
    }

    public async Task<ChatServiceResult<ChatPresenceSnapshot>> GetPresenceAsync(
        int currentUserId,
        int otherUserId,
        CancellationToken cancellationToken = default
    )
    {
        if (currentUserId < 1 || otherUserId < 1)
        {
            return Failure<ChatPresenceSnapshot>(ChatFailureReason.InvalidRequest, "Invalid chat user ID.");
        }

        if (currentUserId == otherUserId)
        {
            return new ChatServiceResult<ChatPresenceSnapshot>
            {
                Success = true,
                Value = new ChatPresenceSnapshot
                {
                    UserId = otherUserId,
                    IsOnline = true,
                    LastSeenAtUtc = DateTime.UtcNow,
                    StatusText = "Online"
                }
            };
        }

        bool isOnline = await _presenceLookup.IsUserOnlineAsync(otherUserId, cancellationToken);
        DateTime? lastSeenAtUtc = isOnline
            ? (DateTime?)null
            : await _presenceLookup.GetLastSeenUtcAsync(otherUserId, cancellationToken);

        if (!isOnline && lastSeenAtUtc == null)
        {
            var userResult = await _userQueryHandler.GetByIdAsync(new UserByIdQuery { TargetUserId = otherUserId }, cancellationToken);
            if (userResult.Success && userResult.User != null)
            {
                lastSeenAtUtc = userResult.User.JoinDate;
            }
        }

        return new ChatServiceResult<ChatPresenceSnapshot>
        {
            Success = true,
            Value = new ChatPresenceSnapshot
            {
                UserId = otherUserId,
                IsOnline = isOnline,
                LastSeenAtUtc = lastSeenAtUtc,
                StatusText = isOnline ? "Online" : "Offline"
            }
        };
    }

    public async Task<ChatServiceResult<SendChatMessageOutcome>> SendMessageAsync(
        SendChatMessageCommand command,
        CancellationToken cancellationToken = default
    )
    {
        if (command.SenderUserId < 1)
        {
            return Failure<SendChatMessageOutcome>(ChatFailureReason.InvalidRequest, "Invalid sender identifier.");
        }

        string content = command.Content?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(content))
        {
            return Failure<SendChatMessageOutcome>(ChatFailureReason.InvalidRequest, "Message content is required.");
        }

        if (content.Length > MaxMessageContentLength)
        {
            return Failure<SendChatMessageOutcome>(ChatFailureReason.InvalidRequest, "Message content exceeds the maximum length.");
        }

        if (ContainsInlineImagePayload(content))
        {
            return Failure<SendChatMessageOutcome>(ChatFailureReason.InvalidRequest, "Inline image payloads are not allowed. Upload the image first.");
        }

        int conversationId;
        int receiverId;
        int? postId = command.PostId;

        if (command.ConversationId.HasValue && command.ConversationId.Value > 0)
        {
            conversationId = command.ConversationId.Value;
            if (!await _messages.CanAccessConversationAsync(command.SenderUserId, conversationId, cancellationToken))
            {
                return Failure<SendChatMessageOutcome>(ChatFailureReason.Forbidden, "You do not have access to this conversation.");
            }

            ConversationAccessMetadata? metadata = await _messages.GetConversationMetadataAsync(conversationId, cancellationToken);
            if (metadata is null)
            {
                return Failure<SendChatMessageOutcome>(ChatFailureReason.NotFound, "Conversation not found.");
            }

            receiverId = command.SenderUserId == metadata.User1Id
                ? metadata.User2Id
                : command.SenderUserId == metadata.User2Id
                    ? metadata.User1Id
                    : 0;

            if (receiverId < 1)
            {
                return Failure<SendChatMessageOutcome>(ChatFailureReason.Forbidden, "You do not have access to this conversation.");
            }

            if (command.ReceiverId.HasValue && command.ReceiverId.Value != receiverId)
            {
                return Failure<SendChatMessageOutcome>(ChatFailureReason.InvalidRequest, "ReceiverId does not match ConversationId.");
            }

            postId = metadata.PostId;
        }
        else if (command.ReceiverId.HasValue && command.ReceiverId.Value > 0)
        {
            receiverId = command.ReceiverId.Value;
            if (receiverId == command.SenderUserId)
            {
                return Failure<SendChatMessageOutcome>(ChatFailureReason.InvalidRequest, "Cannot send a message to yourself.");
            }

            int? resolvedConversationId = await _messages.GetOrCreateConversationIdAsync(
                command.SenderUserId,
                receiverId,
                command.PostId,
                cancellationToken);
            if (!resolvedConversationId.HasValue)
            {
                return Failure<SendChatMessageOutcome>(ChatFailureReason.PersistenceFailed, "Failed to resolve conversation.");
            }

            conversationId = resolvedConversationId.Value;
            if (!await _messages.CanAccessConversationAsync(command.SenderUserId, conversationId, cancellationToken))
            {
                return Failure<SendChatMessageOutcome>(ChatFailureReason.Forbidden, "You do not have access to this conversation.");
            }

            ConversationAccessMetadata? metadata = await _messages.GetConversationMetadataAsync(conversationId, cancellationToken);
            if (metadata is not null)
            {
                postId = metadata.PostId;
            }
        }
        else
        {
            return Failure<SendChatMessageOutcome>(ChatFailureReason.InvalidRequest, "Either ConversationId or ReceiverId is required.");
        }

        var message = new MessageModel
        {
            MessageId = null,
            SenderId = command.SenderUserId,
            ReceiverId = receiverId,
            PostId = postId,
            ConversationId = conversationId,
            Content = content,
            Timestamp = DateTime.UtcNow,
            IsRead = false
        };

        var createdMessage = _messages.Create(message);
        bool saved = await _messages.SaveAsync(createdMessage, cancellationToken);
        if (!saved)
        {
            return Failure<SendChatMessageOutcome>(ChatFailureReason.PersistenceFailed, "Failed to send message.");
        }

        NotificationEnvelope? notification = null;
        try
        {
            string? senderDisplayName = null;
            var senderResult = await _userQueryHandler.GetByIdAsync(
                new UserByIdQuery { TargetUserId = command.SenderUserId },
                cancellationToken);
            if (senderResult.Success && senderResult.User is not null)
            {
                string first = senderResult.User.FirstName?.Trim() ?? string.Empty;
                string last = senderResult.User.LastName?.Trim() ?? string.Empty;
                senderDisplayName = $"{first} {last}".Trim();
            }

            notification = await _notifications.CreateChatMessageNotificationAsync(
                receiverId,
                command.SenderUserId,
                conversationId,
                createdMessage.MessageModel.MessageId ?? 0,
                createdMessage.MessageModel.Content,
                senderDisplayName,
                cancellationToken);
        }
        catch (Exception)
        {
            // Notification failures should not fail message delivery.
        }

        return new ChatServiceResult<SendChatMessageOutcome>
        {
            Success = true,
            Value = new SendChatMessageOutcome
            {
                Message = new ChatMessageEnvelope
                {
                    Message = createdMessage.MessageModel,
                    ReceiverId = receiverId,
                    PostId = postId
                },
                ConversationId = conversationId,
                ReceiverId = receiverId,
                PostId = postId,
                Notification = notification
            }
        };
    }

    private static bool ContainsInlineImagePayload(string content)
    {
        string trimmed = content.Trim();
        if (trimmed.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase) ||
            trimmed.StartsWith("blob:", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (!trimmed.StartsWith(ChatImagePrefix, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        string payload = trimmed[ChatImagePrefix.Length..].Trim();
        if (payload.Length == 0)
        {
            return false;
        }

        string firstLine = payload
            .Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .FirstOrDefault() ?? string.Empty;

        return firstLine.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase) ||
               firstLine.StartsWith("blob:", StringComparison.OrdinalIgnoreCase);
    }

    public Task<ChatServiceResult<SendChatMessageOutcome>> SendRealtimeMessageAsync(
        SendRealtimeChatMessageCommand command,
        CancellationToken cancellationToken = default
    )
    {
        if (command.SenderUserId < 1)
        {
            return Task.FromResult(Failure<SendChatMessageOutcome>(ChatFailureReason.InvalidRequest, "Invalid sender identifier."));
        }

        if (!int.TryParse(command.ReceiverId, out int receiverId) || receiverId < 1)
        {
            return Task.FromResult(Failure<SendChatMessageOutcome>(ChatFailureReason.InvalidRequest, "Invalid receiver identifier."));
        }

        return SendMessageAsync(
            new SendChatMessageCommand
            {
                SenderUserId = command.SenderUserId,
                ReceiverId = receiverId,
                PostId = command.PostId,
                Content = command.Content
            },
            cancellationToken
        );
    }

    private async Task<(bool Resolved, int ReceiverId, int? PostId)> TryResolveReceiverAndPostAsync(
        int currentUserId,
        MessageModel message,
        CancellationToken cancellationToken)
    {
        int receiverId = message.ReceiverId ?? 0;
        int? postId = message.PostId;
        if (receiverId > 0)
        {
            return (true, receiverId, postId);
        }

        ConversationAccessMetadata? metadata = await _messages.GetConversationMetadataAsync(message.ConversationId, cancellationToken);
        if (metadata is null)
        {
            return (false, 0, postId);
        }

        postId ??= metadata.PostId;
        receiverId = message.SenderId == currentUserId
            ? (currentUserId == metadata.User1Id ? metadata.User2Id : metadata.User1Id)
            : currentUserId;
        return (receiverId > 0, receiverId, postId);
    }

    private static ChatServiceResult<T> Failure<T>(ChatFailureReason reason, string message)
    {
        return new ChatServiceResult<T>
        {
            Success = false,
            FailureReason = reason,
            Message = message
        };
    }
}
