using System;

namespace TijarahJo.Domain.Models
{
    public record MessageModel
    {
        public MessageModel() { }

        public MessageModel(
            int? messageId,
            int senderId,
            int conversationId,
            string content,
            DateTime timestamp,
            bool isRead,
            int? receiverId = null,
            int? postId = null)
        {
            this.MessageId = messageId;
            this.SenderId = senderId;
            this.ConversationId = conversationId;
            this.Content = content;
            this.Timestamp = timestamp;
            this.IsRead = isRead;
            this.ReceiverId = receiverId;
            this.PostId = postId;
        }

        public int? MessageId { get; init; }
        public int SenderId { get; init; }
        public int ConversationId { get; init; }
        public int? ReceiverId { get; init; }
        public int? PostId { get; init; }
        public string Content { get; init; } = string.Empty;
        public DateTime Timestamp { get; init; }
        public bool IsRead { get; init; }
    }
}
