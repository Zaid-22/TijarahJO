using System;

namespace TijarahJo.Domain.Models
{
    public record ReviewModel
    {
        public int? ReviewID { get; init; }
        public int ReviewerID { get; init; }
        public int ReviewedUserID { get; init; }
        public int Rating { get; init; } // 1 to 5
        public string Comment { get; init; } = string.Empty;
        public DateTime Timestamp { get; init; }
        
        // Optional: Enriched data
        public string? ReviewerName { get; init; }
        public string? ReviewerAvatar { get; init; }

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
