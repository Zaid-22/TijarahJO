using TijarahJo.Domain.Models;
using TijarahJoDB.DAL.Entities;

namespace TijarahJo.Infrastructure.Mapping;

/// <summary>
/// Shared entity-to-model mapping methods for use across data access adapters.
/// Centralises mapping logic to eliminate duplication.
/// </summary>
public static class EntityMappingExtensions
{
    public static UserModel ToModel(this UserEntity entity)
    {
        return new UserModel(
            entity.UserID,
            entity.HashedPassword,
            entity.Email,
            entity.FirstName,
            entity.LastName ?? string.Empty,
            entity.Phone,
            entity.CityID,
            entity.AreaID,
            entity.Bio,
            entity.Avatar,
            entity.JoinDate,
            entity.Status,
            entity.RoleID,
            entity.IsDeleted,
            entity.TwoFactorEnabled,
            entity.TwoFactorSecret,
            entity.TwoFactorPendingSecret
        );
    }

    /// <summary>
    /// Maps entity to model with HashedPassword stripped.
    /// Use for non-auth read paths (profile views, user lists).
    /// </summary>
    public static UserModel ToPublicModel(this UserEntity entity)
    {
        return entity.ToModel() with { HashedPassword = string.Empty };
    }

    public static PostModel ToModel(this PostEntity entity)
    {
        return new PostModel(
            entity.PostID,
            entity.UserID,
            entity.CategoryID,
            entity.PostTitle,
            entity.PostDescription ?? string.Empty,
            entity.Price,
            entity.Status,
            entity.CreatedAt,
            entity.IsDeleted,
            entity.Views,
            entity.CityID,
            entity.AreaID
        );
    }

    public static MessageModel ToModel(this MessageEntity entity, int? user1Id = null, int? user2Id = null, int? postId = null)
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
}
