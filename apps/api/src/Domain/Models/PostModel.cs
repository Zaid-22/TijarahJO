using System;

namespace TijarahJo.Domain.Models;

    public record PostModel
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
                         long views = 0,
                         int? cityId = null,
                         int? areaId = null)
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
            this.CityId = cityId;
            this.AreaId = areaId;
        }

        public int? PostID { get; init; }
        public int UserID { get; init; }
        public int CategoryID { get; init; }
        public string PostTitle { get; init; }
        public string PostDescription { get; init; }
        public decimal? Price { get; init; }
        public int Status { get; init; }
        public DateTime CreatedAt { get; init; }
        public bool IsDeleted { get; init; }
        public long Views { get; init; }
        /// <summary>FK to dbo.Cities. Null if no location set.</summary>
        public int? CityId { get; init; }
        /// <summary>FK to dbo.Areas. Null if no location set.</summary>
        public int? AreaId { get; init; }

    }
