using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Common;

namespace TijarahJo.Application.Services;

public sealed class RoleQueryHandler : IRoleQueryHandler
{
    private readonly IRoleService _roles;

    public RoleQueryHandler(IRoleService roles)
    {
        _roles = roles;
    }

    public async Task<RoleListQueryResult> GetAllAsync(CancellationToken cancellationToken = default)
    {
        IReadOnlyList<RoleModel> roles = await _roles.GetAllRolesAsync(cancellationToken);
        List<RoleModel> visible = roles
            .Where(role => !role.IsDeleted)
            .Select(CloneRoleModel)
            .ToList();

        return new RoleListQueryResult
        {
            Success = true,
            StatusCode = 200,
            Roles = visible
        };
    }

    public async Task<RoleByIdQueryResult> GetByIdAsync(int roleId, CancellationToken cancellationToken = default)
    {
        if (roleId < 1)
        {
            return new RoleByIdQueryResult
            {
                Success = false,
                StatusCode = 400,
                Message = $"Not accepted ID {roleId}"
            };
        }

        Role? role = await _roles.FindAsync(roleId, cancellationToken);
        if (role == null)
        {
            return new RoleByIdQueryResult
            {
                Success = false,
                StatusCode = 404,
                Message = $"Role with ID {roleId} not found."
            };
        }

        return new RoleByIdQueryResult
        {
            Success = true,
            StatusCode = 200,
            Role = CloneRoleModel(role.RoleModel)
        };
    }

    public async Task<RoleExistsQueryResult> ExistsAsync(int roleId, CancellationToken cancellationToken = default)
    {
        if (roleId < 1)
        {
            return new RoleExistsQueryResult
            {
                Success = false,
                StatusCode = 400,
                Message = $"Not accepted ID {roleId}"
            };
        }

        bool exists = await _roles.DoesRoleExistAsync(roleId, cancellationToken);
        return new RoleExistsQueryResult
        {
            Success = true,
            StatusCode = 200,
            Exists = exists
        };
    }

    private static RoleModel CloneRoleModel(RoleModel source)
    {
        return new RoleModel(
            source.RoleID,
            source.RoleName,
            source.CreatedAt,
            source.IsDeleted
        );
    }
}
