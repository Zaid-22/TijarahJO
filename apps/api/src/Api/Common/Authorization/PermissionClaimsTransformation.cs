using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Api.Common.Utils;

namespace TijarahJo.Api.Common.Authorization;

public sealed class PermissionClaimsTransformation(
    IUserPermissionService userPermissionService) : IClaimsTransformation
{
    private readonly IUserPermissionService _userPermissionService = userPermissionService;

    public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        if (principal.Identity?.IsAuthenticated != true)
        {
            return principal;
        }

        if (!ApiControllerHelpers.TryGetCurrentUserId(principal, out int userId))
        {
            return principal;
        }

        ClaimsIdentity? targetIdentity = principal.Identities.FirstOrDefault(identity => identity.IsAuthenticated);
        if (targetIdentity == null)
        {
            return principal;
        }

        if (principal.HasClaim(PermissionClaimTypes.PermissionsLoaded, "true"))
        {
            return principal;
        }

        UserPermissionSnapshot snapshot = await _userPermissionService.GetUserPermissionSnapshotAsync(
            userId,
            CancellationToken.None);

        var extraIdentity = new ClaimsIdentity(authenticationType: "Permissions");
        extraIdentity.AddClaim(new Claim(PermissionClaimTypes.PermissionsLoaded, "true"));

        if (snapshot.HasAdminAccess)
        {
            extraIdentity.AddClaim(new Claim(PermissionClaimTypes.AdminAccess, "true"));
        }

        foreach (string permissionKey in snapshot.PermissionKeys)
        {
            if (!string.IsNullOrWhiteSpace(permissionKey))
            {
                extraIdentity.AddClaim(new Claim(PermissionClaimTypes.Permission, permissionKey));
            }
        }

        principal.AddIdentity(extraIdentity);
        return principal;
    }
}
