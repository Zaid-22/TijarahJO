using System;

namespace TijarahJoDBAPI.Common.Authorization;

public static class AppRoles
{
    public const string Admin = "Admin";
    public const string User = "User";

    public static bool IsAdminRoleName(string? roleName)
    {
        return string.Equals(roleName?.Trim(), Admin, StringComparison.OrdinalIgnoreCase);
    }

    public static string NormalizeRoleName(string? roleName)
    {
        if (IsAdminRoleName(roleName))
        {
            return Admin;
        }

        return string.IsNullOrWhiteSpace(roleName) ? User : roleName.Trim();
    }
}
