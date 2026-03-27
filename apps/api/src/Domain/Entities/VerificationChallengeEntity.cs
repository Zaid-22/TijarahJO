using System;

namespace TijarahJo.Domain.Entities
{
    public sealed class VerificationChallengeEntity
    {
        public string ChallengeId { get; set; } = string.Empty;
        public string ChallengeType { get; set; } = string.Empty;
        public int UserId { get; set; }
        public string StateJson { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; }

        public UserEntity? User { get; set; }
    }
}
