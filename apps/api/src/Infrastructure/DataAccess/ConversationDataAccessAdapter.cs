using Microsoft.EntityFrameworkCore;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Domain.Entities;
using TijarahJo.Infrastructure.Persistence;

namespace TijarahJo.Infrastructure.DataAccess;


public sealed class ConversationDataAccessAdapter(TijarahJoDbContext dbContext) : IConversationDataAccess
{

    /// <summary>
    /// Finds an existing Conversation by the canonical (User1ID < User2ID, PostID) tuple.
    /// Returns null if no row exists.
    /// </summary>
    public async Task<int?> FindConversationIdAsync(int user1Id, int user2Id, int? postId, CancellationToken cancellationToken = default)
    {
        var conversation = await dbContext.Conversations
            .AsNoTracking()
            .FirstOrDefaultAsync(c =>
                c.User1ID == user1Id &&
                c.User2ID == user2Id &&
                c.PostID == postId,
                cancellationToken);

        return conversation?.ConversationID;
    }

    public async Task<int?> CreateConversationAsync(int user1Id, int user2Id, int? postId, CancellationToken cancellationToken = default)
    {
        try
        {
            var entity = new ConversationEntity
            {
                User1ID = user1Id,
                User2ID = user2Id,
                PostID = postId
            };
            await dbContext.Conversations.AddAsync(entity, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            return entity.ConversationID;
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException)
        {
            return await FindConversationIdAsync(user1Id, user2Id, postId, cancellationToken);
        }
    }

    public async Task<bool> IsUserInConversationAsync(int conversationId, int userId, CancellationToken cancellationToken = default)
    {
        if (conversationId < 1 || userId < 1)
        {
            return false;
        }

        return await dbContext.Conversations
            .AsNoTracking()
            .AnyAsync(c =>
                c.ConversationID == conversationId &&
                (c.User1ID == userId || c.User2ID == userId),
                cancellationToken);
    }

    public async Task<ConversationMetadataModel?> GetConversationMetadataAsync(int conversationId, CancellationToken cancellationToken = default)
    {
        if (conversationId < 1)
        {
            return null;
        }

        var conversation = await dbContext.Conversations
            .AsNoTracking()
            .Where(c => c.ConversationID == conversationId)
            .Select(c => new
            {
                c.User1ID,
                c.User2ID,
                c.PostID
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (conversation == null)
        {
            return null;
        }

        return new ConversationMetadataModel
        {
            User1Id = conversation.User1ID,
            User2Id = conversation.User2ID,
            PostId = conversation.PostID
        };
    }
}
