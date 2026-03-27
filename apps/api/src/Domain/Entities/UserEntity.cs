using System;

namespace TijarahJo.Domain.Entities
{
    public sealed class UserEntity
    {
        public int UserID { get; set; }
        public string HashedPassword { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string? LastName { get; set; }
        public string? Phone { get; set; }
        public int? CityID { get; set; }
        public int? AreaID { get; set; }
        public string? Bio { get; set; }
        public string? Avatar { get; set; }
        public DateTime JoinDate { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int Status { get; set; }
        public int RoleID { get; set; }
        public bool IsDeleted { get; set; }
        public bool TwoFactorEnabled { get; set; }
        public string? TwoFactorSecret { get; set; }
        public string? TwoFactorPendingSecret { get; set; }
        public DateTime? LastInvalidatedAt { get; set; }

        public UserStatusLookupEntity? StatusLookup { get; set; }
        public string? SearchFirstNameNormalized { get; private set; }
        public string? SearchLastNameNormalized { get; private set; }
        public string? SearchFullNameNormalized { get; private set; }
    }
}
