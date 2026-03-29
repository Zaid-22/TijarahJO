using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TijarahJo.Application.Abstractions.Services;

public sealed class UserPermissionSnapshot
{
    public string RoleName { get; init; } = string.Empty;
    public bool HasAdminAccess { get; init; }
    public IReadOnlyList<string> PermissionKeys { get; init; } = [];
}

public interface IUserPermissionService
{
    Task<UserPermissionSnapshot> GetUserPermissionSnapshotAsync(
        int userId,
        CancellationToken cancellationToken = default);

    Task<bool> HasPermissionAsync(
        int userId,
        string permissionKey,
        CancellationToken cancellationToken = default);
}
