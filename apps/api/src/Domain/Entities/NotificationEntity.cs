using System;

namespace TijarahJoDB.DAL.Entities
{
    public sealed class NotificationEntity
    {
        public int NotificationID { get; set; }
        public int UserID { get; set; }
        public string NotificationType { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public int? SenderUserID { get; set; }
        public int? ConversationID { get; set; }
        public int? MessageID { get; set; }
        public string? RouteUrl { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ReadAt { get; set; }
        public string? PayloadJson { get; set; }
    }
}
