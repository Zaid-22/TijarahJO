using System;

namespace Models
{
    public class MessageModel
    {
        public MessageModel() { }

        public MessageModel(int? messageId, int senderId, int receiverId, int? postId, string content, DateTime timestamp, bool isRead)
        {
            this.MessageId = messageId;
            this.SenderId = senderId;
            this.ReceiverId = receiverId;
            this.PostId = postId;
            this.Content = content;
            this.Timestamp = timestamp;
            this.IsRead = isRead;
        }

        public int? MessageId { get; set; }
        public int SenderId { get; set; }
        public int ReceiverId { get; set; }
        public int? PostId { get; set; } // Context for the chat (optional)
        public string Content { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public bool IsRead { get; set; }
    }
}
