using System;

namespace TijarahJo.Domain.Entities
{
    /// <summary>
    /// Represents a distinct chat thread between two users, optionally regarding a specific post.
    /// Created by migration V202602191110__chat_conversations.sql.
    ///
    /// Convention: User1ID is always the smaller UserID to avoid duplicate rows for the same pair.
    /// Uniqueness is enforced by UQ_Conversations_Pair in the database.
    /// </summary>
    public sealed class ConversationEntity
    {
        public int ConversationID { get; set; }

        /// <summary>The user with the lower UserID in the pair.</summary>
        public int User1ID { get; set; }

        /// <summary>The user with the higher UserID in the pair.</summary>
        public int User2ID { get; set; }

        /// <summary>Optional: the post that initiated the conversation.</summary>
        public int? PostID { get; set; }

        /// <summary>
        /// Timestamp of the most recent message in this conversation.
        /// Updated by the application when a message is sent.
        /// Enables inbox sort without an expensive JOIN to Messages.
        /// </summary>
        public DateTime? LastMessageAt { get; set; }

        /// <summary>Soft-delete flag. Deleted conversations are hidden from both participants.</summary>
        public bool IsDeleted { get; set; }
    }
}
