using Models;

namespace TijarahJoDB.BLL
{
    public class UserAccount
    {
        public enum ModeType
        {
            AddNew = 0,
            Update = 1
        }

        public ModeType Mode { get; set; } = ModeType.AddNew;

        public UserModel UserModel =>
            new(
                this.UserID,
                this.HashedPassword,
                this.Email,
                this.FirstName,
                this.LastName,
                this.Phone,
                this.City,
                this.Area,
                this.Bio,
                this.Avatar,
                this.JoinDate,
                this.Status,
                this.RoleID,
                this.IsDeleted
            );

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

        public UserAccount(UserModel userModel, ModeType mode = ModeType.AddNew)
        {
            this.UserID = userModel.UserID;
            this.HashedPassword = userModel.HashedPassword;
            this.Email = userModel.Email;
            this.FirstName = userModel.FirstName;
            this.LastName = userModel.LastName;
            this.Phone = userModel.Phone;
            this.City = userModel.City;
            this.Area = userModel.Area;
            this.Bio = userModel.Bio;
            this.Avatar = userModel.Avatar;
            this.JoinDate = userModel.JoinDate;
            this.Status = userModel.Status;
            this.RoleID = userModel.RoleID;
            this.IsDeleted = userModel.IsDeleted;
            this.Mode = mode;
        }
    }
}
