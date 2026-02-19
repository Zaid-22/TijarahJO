using Models;

namespace TijarahJoDB.BLL
{
    public class Post
    {
        public enum ModeType
        {
            AddNew = 0,
            Update = 1
        }

        public ModeType Mode { get; set; } = ModeType.AddNew;

        public PostModel PostModel =>
            new(
                this.PostID,
                this.UserID,
                this.CategoryID,
                this.PostTitle,
                this.PostDescription,
                this.Price,
                this.Status,
                this.CreatedAt,
                this.IsDeleted,
                this.Views,
                this.City,
                this.Area
            );

        public int? PostID { get; set; }
        public int UserID { get; set; }
        public int CategoryID { get; set; }
        public string PostTitle { get; set; }
        public string PostDescription { get; set; }
        public decimal? Price { get; set; }
        public int Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsDeleted { get; set; }
        public int Views { get; set; }
        public string? City { get; set; }
        public string? Area { get; set; }

        public Post(PostModel postModel, ModeType mode = ModeType.AddNew)
        {
            this.PostID = postModel.PostID;
            this.UserID = postModel.UserID;
            this.CategoryID = postModel.CategoryID;
            this.PostTitle = postModel.PostTitle;
            this.PostDescription = postModel.PostDescription;
            this.Price = postModel.Price;
            this.Status = postModel.Status;
            this.CreatedAt = postModel.CreatedAt;
            this.IsDeleted = postModel.IsDeleted;
            this.Views = postModel.Views;
            this.City = postModel.City;
            this.Area = postModel.Area;
            this.Mode = mode;
        }
    }
}
