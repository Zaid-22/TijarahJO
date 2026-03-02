using System;

namespace TijarahJo.Domain.Models
{
    public class ReviewModel
    {
        public int? ReviewID { get; set; }
        public int ReviewerID { get; set; }
        public int ReviewedUserID { get; set; }
        public int Rating { get; set; } // 1 to 5
        public string Comment { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        
        // Optional: Enriched data
        public string? ReviewerName { get; set; }
        public string? ReviewerAvatar { get; set; }

        public ReviewModel() { }

        public ReviewModel(int? reviewID, int reviewerID, int reviewedUserID, int rating, string comment, DateTime timestamp)
        {
            ReviewID = reviewID;
            ReviewerID = reviewerID;
            ReviewedUserID = reviewedUserID;
            Rating = rating;
            Comment = comment;
            Timestamp = timestamp;
        }
    }
}
