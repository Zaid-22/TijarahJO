using System;

namespace Models;

    public class RoleModel
    {
        public RoleModel(int? roleid, string rolename, DateTime createdat, bool isdeleted)
        {
            this.RoleID = roleid;
            this.RoleName = rolename;
            this.CreatedAt = createdat;
            this.IsDeleted = isdeleted;
        }

        public int? RoleID { get; set; }
        public string RoleName { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsDeleted { get; set; }
    }
