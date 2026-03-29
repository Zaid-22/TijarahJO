using Microsoft.EntityFrameworkCore;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Infrastructure.Persistence;

namespace TijarahJo.Infrastructure.Services;

public sealed class UserPermissionService(TijarahJoDbContext dbContext) : IUserPermissionService
{
    private const string AdminRoleName = "Admin";
    private readonly TijarahJoDbContext _dbContext = dbContext;

    public async Task<UserPermissionSnapshot> GetUserPermissionSnapshotAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        if (userId < 1)
        {
            return new UserPermissionSnapshot();
        }

        var roleInfo = await (
            from user in _dbContext.Users.AsNoTracking()
            join role in _dbContext.Roles.AsNoTracking() on user.RoleID equals role.RoleID
            where user.UserID == userId && !user.IsDeleted && !role.IsDeleted
            select new
            {
                role.RoleID,
                role.RoleName
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (roleInfo == null)
        {
            return new UserPermissionSnapshot();
        }

        string normalizedRoleName = roleInfo.RoleName?.Trim() ?? string.Empty;

        var permissionKeys = await (
            from rolePermission in _dbContext.RolePermissions.AsNoTracking()
            join permission in _dbContext.Permissions.AsNoTracking()
                on rolePermission.PermissionID equals permission.PermissionID
            where rolePermission.RoleID == roleInfo.RoleID
            orderby permission.Category, permission.PermissionKey
            select permission.PermissionKey)
            .Distinct()
            .ToListAsync(cancellationToken);

        return new UserPermissionSnapshot
        {
            RoleName = normalizedRoleName,
            HasAdminAccess = string.Equals(
                normalizedRoleName,
                AdminRoleName,
                StringComparison.OrdinalIgnoreCase) || permissionKeys.Count > 0,
            PermissionKeys = permissionKeys
        };
    }

    public async Task<bool> HasPermissionAsync(
        int userId,
        string permissionKey,
        CancellationToken cancellationToken = default)
    {
        if (userId < 1 || string.IsNullOrWhiteSpace(permissionKey))
        {
            return false;
        }

        UserPermissionSnapshot snapshot = await GetUserPermissionSnapshotAsync(userId, cancellationToken);
        if (string.Equals(snapshot.RoleName, AdminRoleName, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return snapshot.PermissionKeys.Contains(permissionKey.Trim(), StringComparer.OrdinalIgnoreCase);
    }
}
