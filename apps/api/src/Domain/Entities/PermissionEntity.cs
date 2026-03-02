namespace TijarahJoDB.DAL.Entities;

/// <summary>
/// Represents a granular permission that can be assigned to roles.
/// Examples: "users.ban", "posts.delete", "settings.edit", "reports.resolve".
/// </summary>
public sealed class PermissionEntity
{
    public int PermissionID { get; set; }

    /// <summary>Unique permission key, e.g., "users.view", "users.ban", "posts.block".</summary>
    public string PermissionKey { get; set; } = string.Empty;

    /// <summary>Human-readable description.</summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>Grouping category: "Users", "Posts", "Categories", "Reports", "System".</summary>
    public string Category { get; set; } = string.Empty;
}
