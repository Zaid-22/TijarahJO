using System;

namespace Models;

    public class PostImageModel
    {
        public PostImageModel(int? postimageid, int postid, string postimageurl, DateTime uploadedat, bool isdeleted)
        {
            this.PostImageID = postimageid;
            this.PostID = postid;
            this.PostImageURL = postimageurl;
            this.UploadedAt = uploadedat;
            this.IsDeleted = isdeleted;
        }

        public int? PostImageID { get; set; }
        public int PostID { get; set; }
        public string PostImageURL { get; set; }
        public DateTime UploadedAt { get; set; }
        public bool IsDeleted { get; set; }
    }
