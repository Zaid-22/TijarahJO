using System.Threading;
using System.Threading.Tasks;
using TijarahJo.Domain.Models;

namespace TijarahJo.Application.Abstractions.Services;

public sealed class LoginCommand
{
    public string? Login { get; init; }
    public string? Password { get; init; }
}

public sealed class SignupCommand
{
    public string? Email { get; init; }
    public string? Password { get; init; }
    public string? FirstName { get; init; }
    public string? LastName { get; init; }
    public string? Phone { get; init; }
    public int? CityId { get; init; }
    public int? AreaId { get; init; }
    public string? Bio { get; init; }
    public string? Avatar { get; init; }
}

public sealed class GoogleAuthCommand
{
    public string? Subject { get; init; }
    public string? Email { get; init; }
    public string? FirstName { get; init; }
    public string? LastName { get; init; }
    public string? Avatar { get; init; }
}

public enum AuthCommandFailureReason
{
    InvalidRequest,
    InvalidCredentials,
    UserDeleted,
    UserInactive,
    RoleResolutionFailed,
    DuplicateIdentity,
    PersistenceFailed,
    AccountLocked,
    EmailNotVerified
}

public sealed class AuthCommandResult
{
    public bool Success { get; init; }
    public UserModel? User { get; init; }
    public string? RoleName { get; init; }
    public AuthCommandFailureReason? FailureReason { get; init; }
    public string? Message { get; init; }
}

public interface IAuthCommandService
{
    Task<AuthCommandResult> LoginAsync(LoginCommand command, CancellationToken cancellationToken = default);
    Task<AuthCommandResult> SignupAsync(SignupCommand command, CancellationToken cancellationToken = default);
    Task<AuthCommandResult> GoogleAuthAsync(GoogleAuthCommand command, CancellationToken cancellationToken = default);
}
