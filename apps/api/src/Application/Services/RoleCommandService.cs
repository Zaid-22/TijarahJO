using TijarahJo.Domain.Models;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.BLL;

namespace TijarahJoDB.Application.Services;

public sealed class RoleCommandService : IRoleCommandService
{
    private static readonly DateTime SqlDateTimeMinUtc = new(1753, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private readonly IRoleService _roles;

    public RoleCommandService(IRoleService roles)
    {
        _roles = roles;
    }

    public async Task<RoleCommandResult> CreateAsync(CreateRoleCommand command, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(command.RoleName))
        {
            return Failure(RoleCommandFailureReason.InvalidRequest, "Invalid role data.");
        }

        Role role = _roles.Create(new RoleModel(
            null,
            command.RoleName.Trim(),
            NormalizeSqlDateTime(DateTime.UtcNow),
            false
        ));

        bool saved = await _roles.SaveAsync(role, cancellationToken);
        if (!saved)
        {
            return Failure(RoleCommandFailureReason.PersistenceFailed, "Error adding role.");
        }

        return new RoleCommandResult
        {
            Success = true,
            Role = role
        };
    }

    public async Task<RoleCommandResult> UpdateAsync(UpdateRoleCommand command, CancellationToken cancellationToken = default)
    {
        if (command.RoleId < 1 || string.IsNullOrWhiteSpace(command.RoleName))
        {
            return Failure(RoleCommandFailureReason.InvalidRequest, "Invalid role data.");
        }

        Role? role = await _roles.FindAsync(command.RoleId, cancellationToken);
        if (role == null)
        {
            return Failure(RoleCommandFailureReason.NotFound, $"Role with ID {command.RoleId} not found.");
        }

        role.RoleName = command.RoleName.Trim();
        role.CreatedAt = NormalizeSqlDateTime(role.CreatedAt, DateTime.UtcNow);

        bool saved = await _roles.SaveAsync(role, cancellationToken);
        if (!saved)
        {
            return Failure(RoleCommandFailureReason.PersistenceFailed, "Error updating role.");
        }

        return new RoleCommandResult
        {
            Success = true,
            Role = role
        };
    }

    public async Task<RoleCommandResult> DeleteAsync(int roleId, CancellationToken cancellationToken = default)
    {
        if (roleId < 1)
        {
            return Failure(RoleCommandFailureReason.InvalidRequest, "Invalid role ID.");
        }

        if (await _roles.FindAsync(roleId, cancellationToken) == null)
        {
            return Failure(RoleCommandFailureReason.NotFound, $"Role with ID {roleId} not found.");
        }

        bool deleted = await _roles.DeleteRoleAsync(roleId, cancellationToken);
        if (!deleted)
        {
            return Failure(RoleCommandFailureReason.PersistenceFailed, "Failed to delete role.");
        }

        return new RoleCommandResult
        {
            Success = true
        };
    }

    private static DateTime NormalizeSqlDateTime(DateTime value, DateTime? fallback = null)
    {
        if (value == default || value < SqlDateTimeMinUtc)
        {
            return fallback ?? DateTime.UtcNow;
        }

        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
    }

    private static RoleCommandResult Failure(RoleCommandFailureReason reason, string message)
    {
        return new RoleCommandResult
        {
            Success = false,
            FailureReason = reason,
            Message = message
        };
    }
}
