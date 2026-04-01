using System;

namespace TijarahJo.Domain.Models
{
    public record PostCommentModel
    {
        public int? CommentID { get; init; }
        public int PostID { get; init; }
        public int UserID { get; init; }
        public int? ParentCommentID { get; init; }
        public string Content { get; init; } = string.Empty;
        public DateTime CreatedAt { get; init; }
        public DateTime UpdatedAt { get; init; }

        // Enriched data (joined from Users table)
        public string? AuthorName { get; init; }
        public string? AuthorAvatar { get; init; }

        /// <summary>Count of direct replies to this comment.</summary>
        public int ReplyCount { get; init; }
    }
}
