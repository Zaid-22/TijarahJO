using System;

namespace TijarahJoDB.DAL.Entities
{
    public sealed class FavoriteEntity
    {
        public int FavoriteID { get; set; }
        public int UserID { get; set; }
        public int PostID { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsDeleted { get; set; }
    }
}
