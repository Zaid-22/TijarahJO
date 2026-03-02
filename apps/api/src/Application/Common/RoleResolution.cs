using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using TijarahJoDB.Application.Abstractions.Services;

namespace TijarahJoDB.Application.Common;

public static class RoleResolution
{
    public static async Task<int?> ResolveRoleIdByNameAsync(
        IRoleService roles,
        ILogger logger,
        string roleName,
        CancellationToken cancellationToken = default)
    {
        var allRoles = await roles.GetAllRolesAsync(cancellationToken);
        var role = allRoles.FirstOrDefault(item =>
            !item.IsDeleted &&
            item.RoleID.HasValue &&
            string.Equals(item.RoleName, roleName, StringComparison.OrdinalIgnoreCase));

        if (role?.RoleID is > 0)
        {
            return role.RoleID.Value;
        }

        logger.LogError("Failed to resolve role ID by role name '{RoleName}'.", roleName);
        return null;
    }
}
