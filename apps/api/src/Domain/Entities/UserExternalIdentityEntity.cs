using System;

namespace TijarahJo.Domain.Entities
{
    public sealed class UserExternalIdentityEntity
    {
        public int UserExternalIdentityID { get; set; }
        public int UserID { get; set; }
        public string Provider { get; set; } = string.Empty;
        public string ProviderSubject { get; set; } = string.Empty;
        public string? ProviderEmail { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsDeleted { get; set; }
    }
}
