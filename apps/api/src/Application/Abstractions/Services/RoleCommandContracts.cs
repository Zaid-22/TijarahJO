using TijarahJoDB.BLL;

namespace TijarahJoDB.Application.Abstractions.Services;

public enum RoleCommandFailureReason
{
    InvalidRequest,
    NotFound,
    PersistenceFailed
}

public sealed class RoleCommandResult
{
    public bool Success { get; init; }
    public Role? Role { get; init; }
    public RoleCommandFailureReason? FailureReason { get; init; }
    public string? Message { get; init; }
}

public sealed class CreateRoleCommand
{
    public string? RoleName { get; init; }
}

public sealed class UpdateRoleCommand
{
    public int RoleId { get; init; }
    public string? RoleName { get; init; }
}

public interface IRoleCommandService
{
    Task<RoleCommandResult> CreateAsync(CreateRoleCommand command, CancellationToken cancellationToken = default);

    Task<RoleCommandResult> UpdateAsync(UpdateRoleCommand command, CancellationToken cancellationToken = default);

    Task<RoleCommandResult> DeleteAsync(int roleId, CancellationToken cancellationToken = default);
}
