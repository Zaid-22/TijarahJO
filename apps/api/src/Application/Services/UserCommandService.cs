using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Common;
using Microsoft.Extensions.Logging;
using TijarahJo.Application.Abstractions.DataAccess;
using System.Net.Mail;

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
            command.IsDeleted ?? false,
            isEmailVerified: true  // Admin-created accounts are trusted — no email verification needed
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

        UserUpdateFields updateFields = UserUpdateFields.None;

        if (!string.IsNullOrWhiteSpace(command.Password))
        {
            var (isPasswordValid, passwordError) = PasswordHelper.IsPasswordPolicyCompliant(command.Password.Trim());
            if (!isPasswordValid)
            {
                return Failure(UserCommandFailureReason.InvalidRequest, passwordError!);
            }
            user = user with { HashedPassword = PasswordHelper.HashPassword(command.Password.Trim()) };
            updateFields |= UserUpdateFields.HashedPassword;
        }

        if (!string.IsNullOrWhiteSpace(command.Email))
        {
            string normalizedEmail = command.Email.Trim().ToLowerInvariant();
            if (normalizedEmail.Length > 255 ||
                !MailAddress.TryCreate(normalizedEmail, out MailAddress? parsedEmail) ||
                !string.Equals(parsedEmail.Address, normalizedEmail, StringComparison.OrdinalIgnoreCase))
            {
                return Failure(UserCommandFailureReason.InvalidRequest, "A valid email address is required.");
            }

            bool emailChanged = !string.Equals(
                normalizedEmail,
                user.Email,
                StringComparison.OrdinalIgnoreCase);
            if (emailChanged)
            {
                UserModel? existingUser = await _users.GetUserByLoginAsync(
                    normalizedEmail,
                    cancellationToken);
                if (existingUser != null && existingUser.UserID != user.UserID)
                {
                    return Failure(
                        UserCommandFailureReason.InvalidRequest,
                        "Email address is already associated with another account.");
                }
            }

            if (emailChanged)
            {
                user = user with
                {
                    Email = normalizedEmail,
                    IsEmailVerified = false
                };
                updateFields |= UserUpdateFields.Email | UserUpdateFields.IsEmailVerified;
            }
        }

        if (!string.IsNullOrWhiteSpace(command.FirstName))
        {
            string firstName = command.FirstName.Trim();
            if (!string.Equals(firstName, user.FirstName, StringComparison.Ordinal))
            {
                user = user with { FirstName = firstName };
                updateFields |= UserUpdateFields.FirstName;
            }
        }

        if (command.LastName != null)
        {
            string lastName = string.IsNullOrWhiteSpace(command.LastName) ? string.Empty : command.LastName.Trim();
            if (!string.Equals(lastName, user.LastName, StringComparison.Ordinal))
            {
                user = user with { LastName = lastName };
                updateFields |= UserUpdateFields.LastName;
            }
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
            if (!string.Equals(normalizedPhone, user.Phone, StringComparison.Ordinal))
            {
                user = user with { Phone = normalizedPhone };
                updateFields |= UserUpdateFields.Phone;
            }
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

            if (nextCityId != user.CityId || nextAreaId != user.AreaId)
            {
                user = user with { CityId = nextCityId, AreaId = nextAreaId };
                updateFields |= UserUpdateFields.Location;
            }
        }

        if (command.Bio != null)
        {
            string? bio = string.IsNullOrWhiteSpace(command.Bio) ? null : command.Bio.Trim();
            if (!string.Equals(bio, user.Bio, StringComparison.Ordinal))
            {
                user = user with { Bio = bio };
                updateFields |= UserUpdateFields.Bio;
            }
        }

        if (command.Avatar != null)
        {
            if (!string.IsNullOrWhiteSpace(command.Avatar) && !ValidationHelpers.IsValidAvatarUrl(command.Avatar))
            {
                return Failure(UserCommandFailureReason.InvalidRequest, "Avatar must be a valid http or https URL.");
            }
            string? avatar = string.IsNullOrWhiteSpace(command.Avatar) ? null : command.Avatar.Trim();
            if (!string.Equals(avatar, user.Avatar, StringComparison.Ordinal))
            {
                user = user with { Avatar = avatar };
                updateFields |= UserUpdateFields.Avatar;
            }
        }

        if (command.ActorIsAdmin)
        {
            if (command.Status.HasValue)
            {
                if (!UserStatusPolicy.IsValid(command.Status.Value))
                {
                    return Failure(UserCommandFailureReason.InvalidStatus, $"Invalid status. Allowed values: {UserStatusPolicy.AllowedStatusIds}.");
                }

                if (command.Status.Value != user.Status)
                {
                    user = user with { Status = command.Status.Value };
                    updateFields |= UserUpdateFields.Status;
                }
            }

            if (command.RoleId.HasValue &&
                command.RoleId.Value > 0 &&
                command.RoleId.Value != user.RoleID)
            {
                user = user with { RoleID = command.RoleId.Value };
                updateFields |= UserUpdateFields.Role;
            }

            if (command.IsDeleted.HasValue && command.IsDeleted.Value != user.IsDeleted)
            {
                user = user with { IsDeleted = command.IsDeleted.Value };
                updateFields |= UserUpdateFields.IsDeleted;
            }

            if (command.ClearSuspension == true && user.SuspendedUntil.HasValue)
            {
                user = user with { SuspendedUntil = null };
                updateFields |= UserUpdateFields.SuspendedUntil;
            }
        }

        if (updateFields == UserUpdateFields.None)
        {
            return new UserCommandResult
            {
                Success = true,
                User = user
            };
        }

        bool saved = await _users.UpdateUserFieldsAsync(
            user,
            command.ActorUserId,
            updateFields,
            cancellationToken);
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
