using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Common;
using Microsoft.Extensions.Logging;
using TijarahJo.Application.Abstractions.DataAccess;

namespace TijarahJo.Application.Services;

public sealed class UserCommandService(IUserDataAccess users, IRoleService roles, ILocationReadService locations, ILogger<UserCommandService> logger) : IUserCommandService
{
    private const string DefaultUserRoleName = "User";

    private readonly IUserDataAccess _users = users;
    private readonly IRoleService _roles = roles;
    private readonly ILocationReadService _locations = locations;
    private readonly ILogger<UserCommandService> _logger = logger;

    public async Task<UserCommandResult> RegisterAsync(RegisterUserCommand command, CancellationToken cancellationToken = default)
    {
        if (!IsValidRegisterCommand(command, out string? invalidMessage))
        {
            return Failure(UserCommandFailureReason.InvalidRequest, invalidMessage ?? "Invalid user data.");
        }

        var (isPasswordValid, passwordError) = PasswordHelper.IsPasswordPolicyCompliant(command.Password!);
        if (!isPasswordValid)
        {
            return Failure(UserCommandFailureReason.InvalidRequest, passwordError!);
        }

        int status = command.Status ?? UserStatusPolicy.Active;
        if (!UserStatusPolicy.IsValid(status))
        {
            return Failure(UserCommandFailureReason.InvalidStatus, $"Invalid status. Allowed values: {UserStatusPolicy.AllowedStatusIds}.");
        }

        if (!string.IsNullOrWhiteSpace(command.Avatar) && !ValidationHelpers.IsValidAvatarUrl(command.Avatar))
        {
            return Failure(UserCommandFailureReason.InvalidRequest, "Avatar must be a valid http or https URL.");
        }

        // Use the shared RoleResolution helper — eliminates the private duplicate method.
        int? roleId = command.RoleId is > 0
            ? command.RoleId
            : await RoleResolution.ResolveRoleIdByNameAsync(_roles, _logger, DefaultUserRoleName, cancellationToken);
        if (!roleId.HasValue)
        {
            return Failure(UserCommandFailureReason.RoleResolutionFailed, $"Unable to resolve default role '{DefaultUserRoleName}'.");
        }

        string normalizedEmail = command.Email!.Trim().ToLowerInvariant();
        var existingEmailUser = await _users.GetUserByLoginAsync(normalizedEmail, cancellationToken);
        if (existingEmailUser != null)
        {
            return Failure(UserCommandFailureReason.InvalidRequest, "Account already exists with this email.");
        }

        string? normalizedPhone = PhoneNumberNormalizer.NormalizeJordanPhone(command.Phone);
        if (!string.IsNullOrWhiteSpace(normalizedPhone))
        {
            var existingPhoneUser = await _users.GetUserByLoginAsync(normalizedPhone, cancellationToken);
            if (existingPhoneUser != null)
            {
                return Failure(UserCommandFailureReason.InvalidRequest, "Phone number is already associated with another account.");
            }
        }

        var user = new UserModel(
            null,
            PasswordHelper.HashPassword(command.Password!.Trim()),
            normalizedEmail,
            command.FirstName!.Trim(),
            command.LastName?.Trim() ?? string.Empty,
            normalizedPhone,
            command.CityId,
            command.AreaId,
            string.IsNullOrWhiteSpace(command.Bio) ? null : command.Bio.Trim(),
            string.IsNullOrWhiteSpace(command.Avatar) ? null : command.Avatar.Trim(),
            command.JoinDate.HasValue && command.JoinDate.Value != default ? command.JoinDate.Value : DateTime.UtcNow,
            status,
            roleId.Value,
            command.IsDeleted ?? false
        );

        int newUserId = await _users.AddUserAsync(user, cancellationToken);
        if (newUserId <= 0)
        {
            return Failure(UserCommandFailureReason.PersistenceFailed, "Error adding user.");
        }
        user = user with { UserID = newUserId };

        return new UserCommandResult
        {
            Success = true,
            User = user
        };
    }

    public async Task<UserCommandResult> UpdateAsync(UpdateUserCommand command, CancellationToken cancellationToken = default)
    {
        if (command.ActorUserId < 1 || command.TargetUserId < 1)
        {
            return Failure(UserCommandFailureReason.InvalidRequest, "Invalid user data.");
        }

        if (command.TargetUserId != command.ActorUserId && !command.ActorIsAdmin)
        {
            return Failure(UserCommandFailureReason.Forbidden, "You can only update your own profile.");
        }

        UserModel? user = await _users.GetUserByIDAsync(command.TargetUserId, cancellationToken);
        if (user == null)
        {
            return Failure(UserCommandFailureReason.NotFound, $"User with ID {command.TargetUserId} not found.");
        }

        if (!string.IsNullOrWhiteSpace(command.Password))
        {
            var (isPasswordValid, passwordError) = PasswordHelper.IsPasswordPolicyCompliant(command.Password.Trim());
            if (!isPasswordValid)
            {
                return Failure(UserCommandFailureReason.InvalidRequest, passwordError!);
            }
            user = user with { HashedPassword = PasswordHelper.HashPassword(command.Password.Trim()) };
        }

        if (!string.IsNullOrWhiteSpace(command.Email))
        {
            user = user with { Email = command.Email.Trim().ToLowerInvariant() };
        }

        if (!string.IsNullOrWhiteSpace(command.FirstName))
        {
            user = user with { FirstName = command.FirstName.Trim() };
        }

        if (command.LastName != null)
        {
            user = user with { LastName = string.IsNullOrWhiteSpace(command.LastName) ? string.Empty : command.LastName.Trim() };
        }

        if (command.Phone != null)
        {
            string? normalizedPhone = PhoneNumberNormalizer.NormalizeJordanPhone(command.Phone);
            if (normalizedPhone != null && normalizedPhone != user.Phone)
            {
                UserModel? existingUser = await _users.GetUserByLoginAsync(normalizedPhone, cancellationToken);
                if (existingUser != null && existingUser.UserID != user.UserID)
                {
                    return Failure(UserCommandFailureReason.InvalidRequest, "Phone number is already associated with another account.");
                }
            }
            user = user with { Phone = normalizedPhone };
        }

        if (command.CityId.HasValue || command.AreaId.HasValue)
        {
            int? nextCityId = command.CityId.HasValue
                ? (command.CityId.Value > 0 ? command.CityId.Value : null)
                : user.CityId;
            int? nextAreaId = command.AreaId.HasValue
                ? (command.AreaId.Value > 0 ? command.AreaId.Value : null)
                : user.AreaId;

            if (command.CityId.HasValue && !command.AreaId.HasValue && user.CityId != nextCityId)
            {
                nextAreaId = null;
            }

            if (nextAreaId.HasValue && !nextCityId.HasValue)
            {
                return Failure(UserCommandFailureReason.InvalidRequest, "CityId is required when AreaId is provided.");
            }

            var (locationValid, locationMessage) = await ValidationHelpers.ValidateLocationAsync(
                _locations, nextCityId, nextAreaId, cancellationToken);
            if (!locationValid)
            {
                return Failure(UserCommandFailureReason.InvalidRequest, locationMessage);
            }

            user = user with { CityId = nextCityId, AreaId = nextAreaId };
        }

        if (command.Bio != null)
        {
            user = user with { Bio = string.IsNullOrWhiteSpace(command.Bio) ? null : command.Bio.Trim() };
        }

        if (command.Avatar != null)
        {
            if (!string.IsNullOrWhiteSpace(command.Avatar) && !ValidationHelpers.IsValidAvatarUrl(command.Avatar))
            {
                return Failure(UserCommandFailureReason.InvalidRequest, "Avatar must be a valid http or https URL.");
            }
            user = user with { Avatar = string.IsNullOrWhiteSpace(command.Avatar) ? null : command.Avatar.Trim() };
        }

        if (command.ActorIsAdmin)
        {
            if (command.Status.HasValue)
            {
                if (!UserStatusPolicy.IsValid(command.Status.Value))
                {
                    return Failure(UserCommandFailureReason.InvalidStatus, $"Invalid status. Allowed values: {UserStatusPolicy.AllowedStatusIds}.");
                }

                user = user with { Status = command.Status.Value };
            }

            if (command.RoleId.HasValue && command.RoleId.Value > 0)
            {
                user = user with { RoleID = command.RoleId.Value };
            }

            if (command.IsDeleted.HasValue)
            {
                user = user with { IsDeleted = command.IsDeleted.Value };
            }

            if (command.ClearSuspension == true)
            {
                user = user with { SuspendedUntil = null };
            }
        }

        bool saved = await _users.UpdateUserAsync(user, command.ActorUserId, cancellationToken);
        if (!saved)
        {
            return Failure(UserCommandFailureReason.PersistenceFailed, "Failed to update user.");
        }

        return new UserCommandResult
        {
            Success = true,
            User = user
        };
    }

    public async Task<UserCommandResult> DeleteAsync(DeleteUserCommand command, CancellationToken cancellationToken = default)
    {
        if (command.ActorUserId < 1 || command.TargetUserId < 1)
        {
            return Failure(UserCommandFailureReason.InvalidRequest, "Invalid user ID.");
        }

        if (command.TargetUserId != command.ActorUserId && !command.ActorIsAdmin)
        {
            return Failure(UserCommandFailureReason.Forbidden, "You can only delete your own account.");
        }

        UserModel? user = await _users.GetUserByIDAsync(command.TargetUserId, cancellationToken);
        if (user == null)
        {
            return Failure(UserCommandFailureReason.NotFound, $"User with ID {command.TargetUserId} not found.");
        }

        bool deleted = await _users.DeleteUserAsync(command.TargetUserId, command.ActorUserId, cancellationToken);
        if (!deleted)
        {
            return Failure(UserCommandFailureReason.PersistenceFailed, "Failed to delete user.");
        }

        return new UserCommandResult
        {
            Success = true,
            User = user
        };
    }

    private static bool IsValidRegisterCommand(RegisterUserCommand command, out string? invalidMessage)
    {
        invalidMessage = null;

        if (string.IsNullOrWhiteSpace(command.Password) ||
            string.IsNullOrWhiteSpace(command.Email) ||
            string.IsNullOrWhiteSpace(command.FirstName))
        {
            invalidMessage = "Invalid user data.";
            return false;
        }

        if (command.AreaId.HasValue && !command.CityId.HasValue)
        {
            invalidMessage = "CityId is required when AreaId is provided.";
            return false;
        }

        return true;
    }

    private static UserCommandResult Failure(UserCommandFailureReason reason, string message)
    {
        return new UserCommandResult
        {
            Success = false,
            FailureReason = reason,
            Message = message
        };
    }
}
