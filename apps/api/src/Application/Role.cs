using TijarahJo.Domain.Models;

namespace TijarahJo.Application.Common
{
    public class Role(RoleModel roleModel, Role.ModeType mode = Role.ModeType.AddNew)
    {
        public enum ModeType
        {
            AddNew = 0,
            Update = 1
        }

        public ModeType Mode { get; set; } = mode;

        public RoleModel RoleModel =>
            new(
                this.RoleID,
                this.RoleName,
                this.CreatedAt,
                this.IsDeleted
            );

        public int? RoleID { get; set; } = roleModel.RoleID;
        public string RoleName { get; set; } = roleModel.RoleName;
        public DateTime CreatedAt { get; set; } = roleModel.CreatedAt;
        public bool IsDeleted { get; set; } = roleModel.IsDeleted;
    }
}
