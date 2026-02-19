using Models;

namespace TijarahJoDB.BLL
{
    public class PostImage
    {
        public enum ModeType
        {
            AddNew = 0,
            Update = 1
        }

        public ModeType Mode { get; set; } = ModeType.AddNew;

        public PostImageModel PostImageModel =>
            new(
                this.PostImageID,
                this.PostID,
                this.PostImageURL,
                this.UploadedAt,
                this.IsDeleted
            );

        public int? PostImageID { get; set; }
        public int PostID { get; set; }
        public string PostImageURL { get; set; }
        public DateTime UploadedAt { get; set; }
        public bool IsDeleted { get; set; }

        public PostImage(PostImageModel postImageModel, ModeType mode = ModeType.AddNew)
        {
            this.PostImageID = postImageModel.PostImageID;
            this.PostID = postImageModel.PostID;
            this.PostImageURL = postImageModel.PostImageURL;
            this.UploadedAt = postImageModel.UploadedAt;
            this.IsDeleted = postImageModel.IsDeleted;
            this.Mode = mode;
        }
    }
}
