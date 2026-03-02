using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using Models;
using TijarahJoDB.Application.Abstractions.DataAccess;
using TijarahJoDB.Application.Common;
using TijarahJoDB.DAL.Entities;
using TijarahJoDB.DAL.Persistence;

namespace TijarahJoDB_DataAccess;


public sealed class MessageDataAccessAdapter : IMessageDataAccess
{
    private readonly TijarahJoDbContext _dbContext;

    public MessageDataAccessAdapter(TijarahJoDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<int> AddMessageAsync(MessageModel message, CancellationToken cancellationToken = default)
    {
        if (message.ConversationId < 1)
        {
            throw new ArgumentException("ConversationId is required when creating a message.", nameof(message));
        }

        var entity = new MessageEntity
        {
            SenderID = message.SenderId,
            ConversationID = message.ConversationId,
            Content = message.Content,
            CreatedAt = message.Timestamp == default ? DateTime.UtcNow : message.Timestamp,
            IsRead = message.IsRead
        };

        await _dbContext.Messages.AddAsync(entity, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return entity.MessageID;
    }

    /// <summary>
    /// Returns the full message history for a conversation thread.
    /// </summary>
    public async Task<IReadOnlyList<MessageModel>> GetChatHistoryAsync(
        int conversationId,
        CancellationToken cancellationToken = default)
    {
        ConversationMetadata? metadata = await _dbContext.Conversations
            .AsNoTracking()
            .Where(c => c.ConversationID == conversationId)
            .Select(c => new ConversationMetadata(c.User1ID, c.User2ID, c.PostID))
            .FirstOrDefaultAsync(cancellationToken);

        List<MessageEntity> messages = await _dbContext.Messages
            .AsNoTracking()
            .Where(item => item.ConversationID == conversationId)
            .OrderBy(item => item.CreatedAt)
            .ThenBy(item => item.MessageID)
            .ToListAsync(cancellationToken);

        return messages
            .Select(item => ToModel(item, metadata?.User1ID, metadata?.User2ID, metadata?.PostID))
            .ToList();
    }

    /// <summary>
    /// Returns the most recent message per conversation for a given user.
    /// Uses a window function (ROW_NUMBER) over the Conversations table.
    /// Table name: dbo.Messages (canonical name post V202602191100).
    /// </summary>
    public async Task<IReadOnlyList<MessageModel>> GetRecentChatsAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        const string sql = @"
WITH UserConversations AS
(
    SELECT c.ConversationID
    FROM dbo.Conversations AS c
    WHERE c.User1ID = @UserID AND c.IsDeleted = 0
    UNION
    SELECT c.ConversationID
    FROM dbo.Conversations AS c
    WHERE c.User2ID = @UserID AND c.IsDeleted = 0
),
Ranked AS
(
    SELECT
        m.MessageID,
        m.SenderID,
        m.ConversationID,
        m.Content,
        m.CreatedAt,
        m.IsRead,
        m.IsDeleted,
        ROW_NUMBER() OVER
        (
            PARTITION BY m.ConversationID
            ORDER BY m.CreatedAt DESC, m.MessageID DESC
        ) AS RowNum
    FROM dbo.Messages AS m
    INNER JOIN UserConversations AS uc ON uc.ConversationID = m.ConversationID
    WHERE m.IsDeleted = 0
)
SELECT
    MessageID,
    SenderID,
    ConversationID,
    Content,
    CreatedAt,
    IsRead,
    IsDeleted
FROM Ranked
WHERE RowNum = 1
ORDER BY CreatedAt DESC, MessageID DESC;";

        var userIdParameter = new SqlParameter("@UserID", userId);

        List<MessageEntity> recent = await _dbContext.Messages
            .FromSqlRaw(sql, userIdParameter)
            .IgnoreQueryFilters()
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var conversationIds = recent
            .Select(item => item.ConversationID)
            .Distinct()
            .ToList();

        var metadataByConversationId = await _dbContext.Conversations
            .AsNoTracking()
            .Where(c => conversationIds.Contains(c.ConversationID))
            .Select(c => new
            {
                c.ConversationID,
                Metadata = new ConversationMetadata(c.User1ID, c.User2ID, c.PostID)
            })
            .ToDictionaryAsync(c => c.ConversationID, c => c.Metadata, cancellationToken);

        return recent.Select(item =>
        {
            metadataByConversationId.TryGetValue(item.ConversationID, out var metadata);
            return ToModel(item, metadata?.User1ID, metadata?.User2ID, metadata?.PostID);
        }).ToList();
    }

    /// <summary>
    /// Marks all unread messages in a conversation as read for the given receiver.
    /// </summary>
    public async Task<bool> MarkMessagesAsReadAsync(int conversationId, int receiverId, CancellationToken cancellationToken = default)
    {
        int updatedRows = await _dbContext.Messages
            .Where(item =>
                item.ConversationID == conversationId &&
                item.SenderID != receiverId &&
                !item.IsRead)
            .ExecuteUpdateAsync(setters => setters.SetProperty(item => item.IsRead, true), cancellationToken);
        return updatedRows > 0;
    }

    private static MessageModel ToModel(MessageEntity entity, int? user1Id = null, int? user2Id = null, int? postId = null)
    {
        int? receiverId = null;
        if (user1Id.HasValue && user2Id.HasValue)
        {
            receiverId = entity.SenderID == user1Id.Value
                ? user2Id.Value
                : entity.SenderID == user2Id.Value
                    ? user1Id.Value
                    : null;
        }

        return new MessageModel(
            entity.MessageID,
            entity.SenderID,
            entity.ConversationID,
            entity.Content,
            entity.CreatedAt,
            entity.IsRead,
            receiverId,
            postId
        );
    }

    private sealed record ConversationMetadata(int User1ID, int User2ID, int? PostID);
}
