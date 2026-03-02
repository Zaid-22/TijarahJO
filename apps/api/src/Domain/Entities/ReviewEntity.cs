using System;

namespace TijarahJoDB.DAL.Entities
{
    /// <summary>
    /// Represents a user-to-user review.
    /// As of V202602221300 (schema_corrections migration):
    ///   - [Timestamp] column renamed to CreatedAt.
    ///   - IsDeleted soft-delete flag added.
    /// </summary>
    public sealed class ReviewEntity
    {
        public int ReviewID { get; set; }
        public int ReviewerID { get; set; }
        public int ReviewedUserID { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsDeleted { get; set; }
    }
}
