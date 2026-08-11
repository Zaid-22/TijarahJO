using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Common;
using TijarahJo.Domain.Entities;
using TijarahJo.Infrastructure.Persistence;

namespace TijarahJo.Infrastructure.DataAccess;


public sealed class MessageDataAccessAdapter(TijarahJoDbContext dbContext) : IMessageDataAccess
{

    public async Task<int> AddMessageAsync(MessageModel message, CancellationToken cancellationToken = default)
    {
        if (message.ConversationId < 1)
        {
            throw new ArgumentException("ConversationId is required when creating a message.", nameof(message));
        }

        var entity = new MessageEntity
        {
            SenderID = message.SenderId,
            ReceiverID = message.ReceiverId ?? 0,
            ConversationID = message.ConversationId,
            Content = message.Content,
            CreatedAt = message.Timestamp == default ? DateTime.UtcNow : message.Timestamp,
            IsRead = message.IsRead
        };

        await dbContext.Messages.AddAsync(entity, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return entity.MessageID;
    }

    /// <summary>
    /// Returns the full message history for a conversation thread.
    /// </summary>
    public async Task<IReadOnlyList<MessageModel>> GetChatHistoryAsync(
        int conversationId,
        int pageNumber = 1,
        int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        int safePage = Math.Max(1, pageNumber);
        int safeSize = Math.Clamp(pageSize, 1, 200);

        ConversationMetadata? metadata = await dbContext.Conversations
            .AsNoTracking()
            .Where(c => c.ConversationID == conversationId)
            .Select(c => new ConversationMetadata(c.User1ID, c.User2ID, c.PostID))
            .FirstOrDefaultAsync(cancellationToken);

        List<MessageEntity> messages = await dbContext.Messages
            .AsNoTracking()
            .Where(item => item.ConversationID == conversationId)
            .OrderByDescending(item => item.CreatedAt)
            .ThenByDescending(item => item.MessageID)
            .Skip((safePage - 1) * safeSize)
            .Take(safeSize)
            .ToListAsync(cancellationToken);

        // Reverse to chronological order after pagination
        messages.Reverse();

        return [.. messages
            .Select(item => ToModel(item, metadata?.PostID))];
    }

    public async Task<IReadOnlyList<MessageModel>> GetChatHistoryBetweenUsersAsync(
        int userA,
        int userB,
        int pageNumber = 1,
        int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        int user1Id = Math.Min(userA, userB);
        int user2Id = Math.Max(userA, userB);
        int safePage = Math.Max(1, pageNumber);
        int safeSize = Math.Clamp(pageSize, 1, 200);

        var rows = await (
            from message in dbContext.Messages.AsNoTracking()
            join conversation in dbContext.Conversations.AsNoTracking()
                on message.ConversationID equals conversation.ConversationID
            where conversation.User1ID == user1Id && conversation.User2ID == user2Id
            orderby message.CreatedAt descending, message.MessageID descending
            select new
            {
                Message = message,
                conversation.PostID
            })
            .Skip((safePage - 1) * safeSize)
            .Take(safeSize)
            .ToListAsync(cancellationToken);

        rows.Reverse();
        return [.. rows.Select(row => ToModel(row.Message, row.PostID))];
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
        m.ReceiverID,
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
    ReceiverID,
    ConversationID,
    Content,
    CreatedAt,
    IsRead,
    IsDeleted
FROM Ranked
WHERE RowNum = 1
ORDER BY CreatedAt DESC, MessageID DESC;";

        var userIdParameter = new SqlParameter("@UserID", userId);

        List<MessageEntity> recent = await dbContext.Messages
            .FromSqlRaw(sql, userIdParameter)
            .IgnoreQueryFilters()
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var conversationIds = recent
            .Select(item => item.ConversationID)
            .Distinct()
            .ToList();

        var metadataByConversationId = await dbContext.Conversations
            .AsNoTracking()
            .Where(c => conversationIds.Contains(c.ConversationID))
            .Select(c => new
            {
                c.ConversationID,
                Metadata = new ConversationMetadata(c.User1ID, c.User2ID, c.PostID)
            })
            .ToDictionaryAsync(c => c.ConversationID, c => c.Metadata, cancellationToken);

        return [.. recent.Select(item =>
        {
            metadataByConversationId.TryGetValue(item.ConversationID, out var metadata);
            return ToModel(item, metadata?.PostID);
        })];
    }

    /// <summary>
    /// Marks all unread messages in a conversation as read for the given receiver.
    /// </summary>
    public async Task<bool> MarkMessagesAsReadAsync(int conversationId, int receiverId, CancellationToken cancellationToken = default)
    {
        int updatedRows = await dbContext.Messages
            .Where(item =>
                item.ConversationID == conversationId &&
                item.SenderID != receiverId &&
                !item.IsRead)
            .ExecuteUpdateAsync(setters => setters.SetProperty(item => item.IsRead, true), cancellationToken);
        return updatedRows > 0;
    }

    public async Task<bool> MarkMessagesAsReadBetweenUsersAsync(
        int currentUserId,
        int otherUserId,
        CancellationToken cancellationToken = default)
    {
        int user1Id = Math.Min(currentUserId, otherUserId);
        int user2Id = Math.Max(currentUserId, otherUserId);
        IQueryable<int> conversationIds = dbContext.Conversations
            .Where(c => c.User1ID == user1Id && c.User2ID == user2Id)
            .Select(c => c.ConversationID);

        int updatedRows = await dbContext.Messages
            .Where(message =>
                conversationIds.Contains(message.ConversationID) &&
                message.SenderID == otherUserId &&
                message.ReceiverID == currentUserId &&
                !message.IsRead)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(message => message.IsRead, true),
                cancellationToken);

        return updatedRows > 0;
    }

    private static MessageModel ToModel(MessageEntity entity, int? postId = null)
    {
        return new MessageModel(
            entity.MessageID,
            entity.SenderID,
            entity.ConversationID,
            entity.Content,
            entity.CreatedAt,
            entity.IsRead,
            entity.ReceiverID,
            postId
        );
    }

    private sealed record ConversationMetadata(int User1ID, int User2ID, int? PostID);
}
