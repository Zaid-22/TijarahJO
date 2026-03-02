namespace TijarahJoDB.Application.Common;

public static class UserStatusPolicy
{
    public const int Active = 1;
    public const int Banned = 2;
    public const int Inactive = 3;
    public const string AllowedStatusIds = "1 (ACTIVE), 2 (BANNED), 3 (INACTIVE)";

    public static bool IsValid(int status)
    {
        return status is Active or Banned or Inactive;
    }
}
