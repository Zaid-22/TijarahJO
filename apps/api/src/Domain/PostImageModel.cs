using System;

namespace TijarahJo.Domain.Models;

    public record PostImageModel
    {
        public PostImageModel(int? postimageid, int postid, string postimageurl, DateTime uploadedat, bool isdeleted)
        {
            this.PostImageID = postimageid;
            this.PostID = postid;
            this.PostImageURL = postimageurl;
            this.UploadedAt = uploadedat;
            this.IsDeleted = isdeleted;
        }

        public int? PostImageID { get; init; }
        public int PostID { get; init; }
        public string PostImageURL { get; init; }
        public DateTime UploadedAt { get; init; }
        public bool IsDeleted { get; init; }
    }
