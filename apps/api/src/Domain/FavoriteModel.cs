using System;

namespace Models;

public class FavoriteModel
{
    public FavoriteModel(int? favoriteId, int userId, int postId, DateTime createdAt)
    {
        FavoriteID = favoriteId;
        UserID = userId;
        PostID = postId;
        CreatedAt = createdAt;
    }

    public int? FavoriteID { get; set; }
    public int UserID { get; set; }
    public int PostID { get; set; }
    public DateTime CreatedAt { get; set; }
}
