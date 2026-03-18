namespace TijarahJo.Domain.Enums;

/// <summary>
/// User account status values stored in dbo.Users.Status.
/// </summary>
public enum UserStatus
{
    Active = 1,
    Banned = 2,
    Inactive = 3
}

/// <summary>
/// Post status values stored in dbo.Posts.Status.
/// </summary>
public enum PostStatus
{
    Active = 0,
    Blocked = 1,
    Sold = 3
}
