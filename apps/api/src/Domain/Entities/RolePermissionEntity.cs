namespace TijarahJo.Domain.Entities;

/// <summary>
/// Junction table mapping roles to permissions (many-to-many).
/// </summary>
public sealed class RolePermissionEntity
{
    [System.ComponentModel.DataAnnotations.Key]
    public int RolePermissionID { get; set; }
    public int RoleID { get; set; }
    public int PermissionID { get; set; }

    // Navigation
    public RoleEntity? Role { get; set; }
    public PermissionEntity? Permission { get; set; }
}
