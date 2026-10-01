using System.Threading;
using System.Threading.Tasks;
using TijarahJo.Domain.Models;

namespace TijarahJo.Application.Abstractions.Services;

public sealed class RegisterUserCommand
{
    public string? Password { get; init; }
    public string? Email { get; init; }
    public string? FirstName { get; init; }
    public string? LastName { get; init; }
    public string? Phone { get; init; }
    public int? CityId { get; init; }
    public int? AreaId { get; init; }
    public string? Bio { get; init; }
    public string? Avatar { get; init; }
    public DateTime? JoinDate { get; init; }
    public int? Status { get; init; }
    public int? RoleId { get; init; }
    public bool? IsDeleted { get; init; }
}

public sealed class UpdateUserCommand
{
    public int ActorUserId { get; init; }
    public bool ActorIsAdmin { get; init; }
    public int TargetUserId { get; init; }
    public string? Password { get; init; }
    public string? Email { get; init; }
    public string? FirstName { get; init; }
    public string? LastName { get; init; }
    public string? Phone { get; init; }
    public int? CityId { get; init; }
    public int? AreaId { get; init; }
    public string? Bio { get; init; }
    public string? Avatar { get; init; }
    public int? Status { get; init; }
    public int? RoleId { get; init; }
    public bool? IsDeleted { get; init; }
    public bool? ClearSuspension { get; init; }
}

public sealed class DeleteUserCommand
{
    public int ActorUserId { get; init; }
    public bool ActorIsAdmin { get; init; }
    public int TargetUserId { get; init; }
}

public enum UserCommandFailureReason
{
    InvalidRequest,
    Forbidden,
    NotFound,
    InvalidStatus,
    RoleResolutionFailed,
    PersistenceFailed
}

public sealed class UserCommandResult
{
    public bool Success { get; init; }
    public UserModel? User { get; init; }
    public UserCommandFailureReason? FailureReason { get; init; }
    public string? Message { get; init; }
}

public interface IUserCommandService
{
    Task<UserCommandResult> RegisterAsync(RegisterUserCommand command, CancellationToken cancellationToken = default);
    Task<UserCommandResult> UpdateAsync(UpdateUserCommand command, CancellationToken cancellationToken = default);
    Task<UserCommandResult> DeleteAsync(DeleteUserCommand command, CancellationToken cancellationToken = default);
}
