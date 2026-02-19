using System;

namespace Models;
    public class UserModel
    {
        public UserModel(
            int? userid,
            string hashedpassword,
            string email,
            string firstname,
            string lastname,
            string? phone,
            string? city,
            string? area,
            string? bio,
            string? avatar,
            DateTime joindate,
            int status,
            int roleid,
            bool isdeleted)
        {
            this.UserID = userid;
            this.HashedPassword = hashedpassword;
            this.Email = email;
            this.FirstName = firstname;
            this.LastName = lastname;
            this.Phone = phone;
            this.City = city;
            this.Area = area;
            this.Bio = bio;
            this.Avatar = avatar;
            this.JoinDate = joindate;
            this.Status = status;
            this.RoleID = roleid;
            this.IsDeleted = isdeleted;
        }

        public int? UserID { get; set; }

        public string HashedPassword { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string? Phone { get; set; }
        public string? City { get; set; }
        public string? Area { get; set; }
        public string? Bio { get; set; }
        public string? Avatar { get; set; }
        public DateTime JoinDate { get; set; }
        public int Status { get; set; }
        public int RoleID { get; set; }
        public bool IsDeleted { get; set; }
    }
