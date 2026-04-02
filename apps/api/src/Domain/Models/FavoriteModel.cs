using System;

namespace TijarahJo.Domain.Models;

public record FavoriteModel
{
    public FavoriteModel(int? favoriteId, int userId, int postId, DateTime createdAt)
    {
        FavoriteID = favoriteId;
        UserID = userId;
        PostID = postId;
        CreatedAt = createdAt;
    }

    public int? FavoriteID { get; init; }
    public int UserID { get; init; }
    public int PostID { get; init; }
    public DateTime CreatedAt { get; init; }
}
