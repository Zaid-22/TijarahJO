using Models;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.Application.Common;
using TijarahJoDB.BLL;
using Microsoft.Extensions.Logging;
using TijarahJoDB.Application.Abstractions.DataAccess;

namespace TijarahJoDB.Application.Services;

public sealed class UserCommandService : IUserCommandService
{
    private const string DefaultUserRoleName = "User";

    private readonly IUserDataAccess _users;
    private readonly IRoleService _roles;
    private readonly ILogger<UserCommandService> _logger;

    public UserCommandService(IUserDataAccess users, IRoleService roles, ILogger<UserCommandService> logger)
    {
        _users = users;
        _roles = roles;
        _logger = logger;
    }

    public async Task<UserCommandResult> RegisterAsync(RegisterUserCommand command, CancellationToken cancellationToken = default)
    {
        if (!IsValidRegisterCommand(command, out string? invalidMessage))
        {
            return Failure(UserCommandFailureReason.InvalidRequest, invalidMessage ?? "Invalid user data.");
        }

        int status = command.Status ?? UserStatusPolicy.Active;
        if (!UserStatusPolicy.IsValid(status))
        {
            return Failure(UserCommandFailureReason.InvalidStatus, $"Invalid status. Allowed values: {UserStatusPolicy.AllowedStatusIds}.");
        }

        if (!string.IsNullOrWhiteSpace(command.Avatar) && !IsValidAvatarUrl(command.Avatar))
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

        var user = new UserModel(
            null,
            PasswordHelper.HashPassword(command.Password!.Trim()),
            command.Email!.Trim().ToLowerInvariant(),
            command.FirstName!.Trim(),
            command.LastName?.Trim() ?? string.Empty,
            PhoneNumberNormalizer.NormalizeJordanPhone(command.Phone),
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
        user.UserID = newUserId;

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
            user.HashedPassword = PasswordHelper.HashPassword(command.Password.Trim());
        }

        if (!string.IsNullOrWhiteSpace(command.Email))
        {
            user.Email = command.Email.Trim().ToLowerInvariant();
        }

        if (!string.IsNullOrWhiteSpace(command.FirstName))
        {
            user.FirstName = command.FirstName.Trim();
        }

        if (command.LastName != null)
        {
            user.LastName = string.IsNullOrWhiteSpace(command.LastName) ? string.Empty : command.LastName.Trim();
        }

        if (command.Phone != null)
        {
            user.Phone = PhoneNumberNormalizer.NormalizeJordanPhone(command.Phone);
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

            user.CityId = nextCityId;
            user.AreaId = nextAreaId;
        }

        if (command.Bio != null)
        {
            user.Bio = string.IsNullOrWhiteSpace(command.Bio) ? null : command.Bio.Trim();
        }

        if (command.Avatar != null)
        {
            if (!string.IsNullOrWhiteSpace(command.Avatar) && !IsValidAvatarUrl(command.Avatar))
            {
                return Failure(UserCommandFailureReason.InvalidRequest, "Avatar must be a valid http or https URL.");
            }
            user.Avatar = string.IsNullOrWhiteSpace(command.Avatar) ? null : command.Avatar.Trim();
        }

        if (command.ActorIsAdmin)
        {
            if (command.Status.HasValue)
            {
                if (!UserStatusPolicy.IsValid(command.Status.Value))
                {
                    return Failure(UserCommandFailureReason.InvalidStatus, $"Invalid status. Allowed values: {UserStatusPolicy.AllowedStatusIds}.");
                }

                user.Status = command.Status.Value;
            }

            if (command.RoleId.HasValue && command.RoleId.Value > 0)
            {
                user.RoleID = command.RoleId.Value;
            }

            if (command.IsDeleted.HasValue)
            {
                user.IsDeleted = command.IsDeleted.Value;
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

    private static bool IsValidAvatarUrl(string avatar)
    {
        return Uri.TryCreate(avatar.Trim(), UriKind.Absolute, out Uri? uri)
               && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
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
