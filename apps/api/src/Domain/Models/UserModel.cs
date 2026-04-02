using System;

namespace TijarahJo.Domain.Models;

    public record UserModel
    {
        public UserModel(
            int? userid,
            string hashedpassword,
            string email,
            string firstname,
            string lastname,
            string? phone,
            int? cityId,
            int? areaId,
            string? bio,
            string? avatar,
            DateTime joindate,
            int status,
            int roleid,
            bool isdeleted,
            bool twoFactorEnabled = false,
            string? twoFactorSecret = null,
            string? twoFactorPendingSecret = null)
        {
            this.UserID = userid;
            this.HashedPassword = hashedpassword;
            this.Email = email;
            this.FirstName = firstname;
            this.LastName = lastname;
            this.Phone = phone;
            this.CityId = cityId;
            this.AreaId = areaId;
            this.Bio = bio;
            this.Avatar = avatar;
            this.JoinDate = joindate;
            this.Status = status;
            this.RoleID = roleid;
            this.IsDeleted = isdeleted;
            this.TwoFactorEnabled = twoFactorEnabled;
            this.TwoFactorSecret = twoFactorSecret;
            this.TwoFactorPendingSecret = twoFactorPendingSecret;
        }

        public int? UserID { get; init; }

        public string HashedPassword { get; init; }
        public string Email { get; init; }
        public string FirstName { get; init; }
        public string LastName { get; init; }
        public string? Phone { get; init; }
        /// <summary>FK to dbo.Cities. Null if the user has not set a city.</summary>
        public int? CityId { get; init; }
        /// <summary>FK to dbo.Areas. Null if the user has not set an area.</summary>
        public int? AreaId { get; init; }
        public string? Bio { get; init; }
        public string? Avatar { get; init; }
        public DateTime JoinDate { get; init; }
        public int Status { get; init; }
        public int RoleID { get; init; }
        public bool IsDeleted { get; init; }
        public bool TwoFactorEnabled { get; init; }
        public string? TwoFactorSecret { get; init; }
        public string? TwoFactorPendingSecret { get; init; }
    }
