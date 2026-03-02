using System;

namespace TijarahJo.Domain.Models;

    public class UserModel
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

        public int? UserID { get; set; }

        public string HashedPassword { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string? Phone { get; set; }
        /// <summary>FK to dbo.Cities. Null if the user has not set a city.</summary>
        public int? CityId { get; set; }
        /// <summary>FK to dbo.Areas. Null if the user has not set an area.</summary>
        public int? AreaId { get; set; }
        public string? Bio { get; set; }
        public string? Avatar { get; set; }
        public DateTime JoinDate { get; set; }
        public int Status { get; set; }
        public int RoleID { get; set; }
        public bool IsDeleted { get; set; }
        public bool TwoFactorEnabled { get; set; }
        public string? TwoFactorSecret { get; set; }
        public string? TwoFactorPendingSecret { get; set; }
    }
