using System;

namespace TijarahJo.Domain.Models;

    public record RoleModel
    {
        public RoleModel(int? roleid, string rolename, DateTime createdat, bool isdeleted)
        {
            this.RoleID = roleid;
            this.RoleName = rolename;
            this.CreatedAt = createdat;
            this.IsDeleted = isdeleted;
        }

        public int? RoleID { get; init; }
        public string RoleName { get; init; }
        public DateTime CreatedAt { get; init; }
        public bool IsDeleted { get; init; }
    }
