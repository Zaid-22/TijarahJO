using System.Security.Claims;

namespace TijarahJo.Api.Common.Authorization;

/// <summary>
/// Authorization helpers that prefer DB-backed claims from <see cref="PermissionClaimsTransformation"/>
/// over role values embedded in the JWT at login time.
/// </summary>
public static class AuthorizationPrincipalHelpers
{
    public static bool IsAdminRole(ClaimsPrincipal user)
    {
        string? currentRole = user.FindFirst(PermissionClaimTypes.CurrentRole)?.Value;
        if (!string.IsNullOrWhiteSpace(currentRole))
        {
            return AppRoles.IsAdminRoleName(currentRole);
        }

        if (user.IsInRole(AppRoles.Admin))
        {
            return true;
        }

        return user.Claims.Any(claim =>
            claim.Type == ClaimTypes.Role &&
            AppRoles.IsAdminRoleName(claim.Value));
    }

    public static bool HasAdminAccess(ClaimsPrincipal user)
        => user.HasClaim(PermissionClaimTypes.AdminAccess, "true")
           || IsAdminRole(user);

    public static bool HasPermission(ClaimsPrincipal user, string permissionKey)
        => IsAdminRole(user)
           || user.HasClaim(PermissionClaimTypes.Permission, permissionKey);
}
