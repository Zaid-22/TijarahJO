using System;

namespace TijarahJo.Domain.Entities
{
    public sealed class PushSubscriptionEntity
    {
        public int PushSubscriptionID { get; set; }
        public int UserID { get; set; }
        public string Endpoint { get; set; } = string.Empty;
        public string P256DH { get; set; } = string.Empty;
        public string Auth { get; set; } = string.Empty;
        public string? UserAgent { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? LastSuccessAt { get; set; }
        public DateTime? LastFailureAt { get; set; }
        public string? LastFailureReason { get; set; }
    }
}
