using System;

namespace TijarahJoDB.DAL.Entities
{
    public sealed class PostImageEntity
    {
        public int PostImageID { get; set; }
        public int PostID { get; set; }
        public string PostImageURL { get; set; } = string.Empty;
        public bool IsDeleted { get; set; }
        public DateTime UploadedAt { get; set; }
    }
}
