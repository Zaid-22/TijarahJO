using System;

namespace Models;

    public class PostModel
    {
        public PostModel(int? postid,
                         int userid,
                         int categoryid,
                         string posttitle,
                         string postdescription,
                         decimal? price,
                         int status,
                         DateTime createdat,
                         bool isdeleted,
                         int views = 0,
                         string? city = null,
                         string? area = null)
        {
            this.PostID = postid;
            this.UserID = userid;
            this.CategoryID = categoryid;
            this.PostTitle = posttitle;
            this.PostDescription = postdescription;
            this.Price = price;
            this.Status = status;
            this.CreatedAt = createdat;
            this.IsDeleted = isdeleted;
            this.Views = views;
            this.City = city;
            this.Area = area;
        }

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
        
        // Added for image support
        public List<string> Images { get; set; } = new List<string>();
    }
