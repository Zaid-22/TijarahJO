using System.Security.Claims;
using TijarahJo.Api.Common.Authorization;

namespace TijarahJo.Api.Tests;

public sealed class AuthorizationPrincipalHelpersTests
{
    [Fact]
    public void HasPermission_GrantsAllPermissions_WhenCurrentRoleIsAdmin()
    {
        var principal = new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim(PermissionClaimTypes.CurrentRole, AppRoles.Admin),
            new Claim(PermissionClaimTypes.AdminAccess, "true"),
        ],
        authenticationType: "Permissions"));

        Assert.True(AuthorizationPrincipalHelpers.HasPermission(principal, PermissionKeys.UsersView));
        Assert.True(AuthorizationPrincipalHelpers.HasPermission(principal, PermissionKeys.SettingsManage));
    }

    [Fact]
    public void HasPermission_RequiresExplicitPermission_ForNonAdminRole()
    {
        var principal = new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim(PermissionClaimTypes.CurrentRole, "Moderator"),
            new Claim(PermissionClaimTypes.AdminAccess, "true"),
            new Claim(PermissionClaimTypes.Permission, PermissionKeys.PostsView),
        ],
        authenticationType: "Permissions"));

        Assert.True(AuthorizationPrincipalHelpers.HasPermission(principal, PermissionKeys.PostsView));
        Assert.False(AuthorizationPrincipalHelpers.HasPermission(principal, PermissionKeys.UsersView));
    }

    [Fact]
    public void HasPermission_DeniesStaleJwtAdminRole_WhenCurrentRoleIsUser()
    {
        var jwtIdentity = new ClaimsIdentity(
        [
            new Claim(ClaimTypes.Role, AppRoles.Admin),
        ],
        authenticationType: "Bearer");
        var permissionsIdentity = new ClaimsIdentity(
        [
            new Claim(PermissionClaimTypes.CurrentRole, AppRoles.User),
            new Claim(PermissionClaimTypes.AdminAccess, "true"),
        ],
        authenticationType: "Permissions");

        var principal = new ClaimsPrincipal(jwtIdentity);
        principal.AddIdentity(permissionsIdentity);

        Assert.False(AuthorizationPrincipalHelpers.HasPermission(principal, PermissionKeys.UsersView));
    }

    [Fact]
    public void IsAdminRole_DeniesStaleJwtAdminRole_WhenDatabasePermissionsDidNotLoadARole()
    {
        var principal = new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim(ClaimTypes.Role, AppRoles.Admin),
            new Claim(PermissionClaimTypes.PermissionsLoaded, "true")
        ],
        authenticationType: "Bearer"));

        Assert.False(AuthorizationPrincipalHelpers.IsAdminRole(principal));
    }
}
