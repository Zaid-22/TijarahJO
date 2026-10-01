using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Common;

namespace TijarahJo.Application.Services;

public sealed class RoleService : IRoleService
{
    private readonly IRoleDataAccess _roles;

    public RoleService(IRoleDataAccess roles)
    {
        _roles = roles;
    }

    public Task<IReadOnlyList<RoleModel>> GetAllRolesAsync(CancellationToken cancellationToken = default)
        => _roles.GetAllRolesAsync(cancellationToken);

    public async Task<Role?> FindAsync(int? roleId, CancellationToken cancellationToken = default)
    {
        RoleModel roleModel = await _roles.GetRoleByIDAsync(roleId, cancellationToken);
        return roleModel == null ? null : new Role(roleModel, Role.ModeType.Update);
    }

    public Role Create(RoleModel model) => new(model);

    public async Task<bool> SaveAsync(Role role, CancellationToken cancellationToken = default)
    {
        if (role.Mode == Role.ModeType.AddNew)
        {
            int roleId = await _roles.AddRoleAsync(role.RoleModel, cancellationToken);
            if (roleId <= 0)
            {
                return false;
            }

            role.RoleID = roleId;
            role.Mode = Role.ModeType.Update;
            return true;
        }

        return await _roles.UpdateRoleAsync(role.RoleModel, cancellationToken);
    }

    public Task<bool> DeleteRoleAsync(int? roleId, CancellationToken cancellationToken = default)
        => _roles.DeleteRoleAsync(roleId, cancellationToken);

    public Task<bool> DoesRoleExistAsync(int? roleId, CancellationToken cancellationToken = default)
        => _roles.DoesRoleExistAsync(roleId, cancellationToken);

    public Task<bool> IsRoleNameTakenAsync(string roleName, int? excludeRoleId = null, CancellationToken cancellationToken = default)
        => _roles.IsRoleNameTakenAsync(roleName, excludeRoleId, cancellationToken);
}
