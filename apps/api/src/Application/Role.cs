using TijarahJo.Domain.Models;

namespace TijarahJoDB.BLL
{
    public class Role
    {
        public enum ModeType
        {
            AddNew = 0,
            Update = 1
        }

        public ModeType Mode { get; set; } = ModeType.AddNew;

        public RoleModel RoleModel =>
            new(
                this.RoleID,
                this.RoleName,
                this.CreatedAt,
                this.IsDeleted
            );

        public int? RoleID { get; set; }
        public string RoleName { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsDeleted { get; set; }

        public Role(RoleModel roleModel, ModeType mode = ModeType.AddNew)
        {
            this.RoleID = roleModel.RoleID;
            this.RoleName = roleModel.RoleName;
            this.CreatedAt = roleModel.CreatedAt;
            this.IsDeleted = roleModel.IsDeleted;
            this.Mode = mode;
        }
    }
}
