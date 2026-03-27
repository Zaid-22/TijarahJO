using System;

namespace TijarahJo.Domain.Entities
{
    /// <summary>
    /// Represents a single message within a Conversation.
    /// As of V202602191110 (chat_conversations migration):
    ///   - ReceiverID and PostID were removed from this table.
    ///   - ConversationID foreign key was added.
    ///   - Routing is now done through dbo.Conversations.
    /// As of V202602221300 (schema_corrections migration):
    ///   - [Timestamp] column renamed to CreatedAt.
    ///   - IsDeleted soft-delete flag added.
    /// </summary>
    public sealed class MessageEntity
    {
        public int MessageID { get; set; }
        public int SenderID { get; set; }
        public int ReceiverID { get; set; }
        public int ConversationID { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public bool IsRead { get; set; }
        public bool IsDeleted { get; set; }

        // Navigation properties
        public ConversationEntity? Conversation { get; set; }
    }
}
