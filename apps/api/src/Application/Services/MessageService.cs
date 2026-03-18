using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Common;

namespace TijarahJo.Application.Services;

public sealed class MessageService : IMessageService
{
    private readonly IMessageDataAccess _messages;
    private readonly IConversationDataAccess _conversations;

    public MessageService(IMessageDataAccess messages, IConversationDataAccess conversations)
    {
        _messages = messages;
        _conversations = conversations;
    }

    public async Task<int?> GetOrCreateConversationIdAsync(int userA, int userB, int? postId = null, CancellationToken cancellationToken = default)
    {
        if (userA < 1 || userB < 1 || userA == userB)
        {
            return null;
        }

        int user1 = Math.Min(userA, userB);
        int user2 = Math.Max(userA, userB);

        int? existing = await _conversations.FindConversationIdAsync(user1, user2, postId, cancellationToken);
        if (existing.HasValue)
        {
            return existing;
        }

        return await _conversations.CreateConversationAsync(user1, user2, postId, cancellationToken);
    }

    public Task<bool> CanAccessConversationAsync(int userId, int conversationId, CancellationToken cancellationToken = default)
    {
        return _conversations.IsUserInConversationAsync(conversationId, userId, cancellationToken);
    }

    public async Task<ConversationAccessMetadata?> GetConversationMetadataAsync(int conversationId, CancellationToken cancellationToken = default)
    {
        ConversationMetadataModel? metadata = await _conversations.GetConversationMetadataAsync(conversationId, cancellationToken);
        if (metadata is null)
        {
            return null;
        }

        return new ConversationAccessMetadata
        {
            User1Id = metadata.User1Id,
            User2Id = metadata.User2Id,
            PostId = metadata.PostId
        };
    }

    public async Task<List<MessageModel>> GetChatHistoryAsync(int conversationId, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
        => new(await _messages.GetChatHistoryAsync(conversationId, pageNumber, pageSize, cancellationToken));

    public async Task<List<MessageModel>> GetRecentChatsAsync(int userId, CancellationToken cancellationToken = default)
        => new(await _messages.GetRecentChatsAsync(userId, cancellationToken));

    public Task<bool> MarkAsReadAsync(int conversationId, int receiverId, CancellationToken cancellationToken = default)
        => _messages.MarkMessagesAsReadAsync(conversationId, receiverId, cancellationToken);

    public Message Create(MessageModel model) => new(model);

    public async Task<bool> SaveAsync(Message message, CancellationToken cancellationToken = default)
    {
        if (!await CanPersistMessageAsync(message.MessageModel, cancellationToken))
        {
            return false;
        }

        int messageId = await _messages.AddMessageAsync(message.MessageModel, cancellationToken);
        if (messageId <= 0)
        {
            return false;
        }

        message.MessageModel = message.MessageModel with { MessageId = messageId };
        return true;
    }

    private async Task<bool> CanPersistMessageAsync(MessageModel model, CancellationToken cancellationToken)
    {
        if (model.SenderId < 1 || model.ConversationId < 1)
        {
            return false;
        }

        return await _conversations.IsUserInConversationAsync(model.ConversationId, model.SenderId, cancellationToken);
    }
}
