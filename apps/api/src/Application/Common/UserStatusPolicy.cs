using TijarahJo.Domain.Enums;

namespace TijarahJo.Application.Common;

public static class UserStatusPolicy
{
    // Enum-backed constants for backward compatibility
    public const int Active = (int)UserStatus.Active;
    public const int Banned = (int)UserStatus.Banned;
    public const int Inactive = (int)UserStatus.Inactive;

    public const string AllowedStatusIds = "1 (ACTIVE), 2 (BANNED), 3 (INACTIVE)";

    public static bool IsValid(int status)
    {
        return Enum.IsDefined(typeof(UserStatus), status);
    }
}
