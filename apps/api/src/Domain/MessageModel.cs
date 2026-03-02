using System;

namespace Models
{
    public class MessageModel
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

        public int? MessageId { get; set; }
        public int SenderId { get; set; }
        public int ConversationId { get; set; }
        public int? ReceiverId { get; set; }
        public int? PostId { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public bool IsRead { get; set; }
    }
}
