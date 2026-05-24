using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Common;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;
using TijarahJo.Application.Abstractions.DataAccess;

namespace TijarahJo.Application.Services;

public sealed class AuthCommandService(
    IUserDataAccess users,
    IExternalIdentityDataAccess externalIdentities,
    IRoleService roles,
    ILocationReadService locations,
    IAccountLockoutService accountLockout,
    ILogger<AuthCommandService> logger) : IAuthCommandService
{
    private const string DefaultUserRoleName = "User";
    private const string GoogleProviderName = "google";

    // Dummy hash for constant-time comparison when user is not found,
    // preventing timing-based user-enumeration attacks.
    private static readonly string _dummyHash = PasswordHelper.HashPassword("dummy-timing-guard-password");

    private readonly IUserDataAccess _users = users;
    private readonly IExternalIdentityDataAccess _externalIdentities = externalIdentities;
    private readonly IRoleService _roles = roles;
    private readonly ILocationReadService _locations = locations;
    private readonly IAccountLockoutService _accountLockout = accountLockout;
    private readonly ILogger<AuthCommandService> _logger = logger;

    public async Task<AuthCommandResult> LoginAsync(LoginCommand command, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(command.Login) || string.IsNullOrWhiteSpace(command.Password))
        {
            return Failure(AuthCommandFailureReason.InvalidRequest, "Invalid login data.");
        }

        string normalizedLogin = command.Login.Trim();
        string? normalizedPhone = PhoneNumberNormalizer.NormalizeJordanPhone(normalizedLogin);

        var loginCandidates = new List<string> { normalizedLogin };
        if (!string.IsNullOrWhiteSpace(normalizedPhone) &&
            !string.Equals(normalizedLogin, normalizedPhone, StringComparison.OrdinalIgnoreCase))
        {
            loginCandidates.Add(normalizedPhone);
        }

        UserModel? user = await _users.GetUserByLoginCandidatesAsync(loginCandidates, cancellationToken);

        // Check account lockout before password verification
        if (user != null && user.UserID.HasValue)
        {
            AccountLockoutResult lockoutResult = await _accountLockout.IsLockedOutAsync(user.UserID.Value, cancellationToken);
            if (lockoutResult.IsLockedOut)
            {
                string lockedUntil = lockoutResult.LockedUntilUtc?.ToString("yyyy-MM-dd HH:mm") + " UTC" ?? "shortly";
                return Failure(
                    AuthCommandFailureReason.AccountLocked,
                    $"Too many failed login attempts. Your account is locked until {lockedUntil}. Please try again later."
                );
            }
        }

        // Always run a hash comparison to prevent timing-based user enumeration.
        // When user is null, compare against a dummy hash so both paths take equal time.
        string hashToVerify = user?.HashedPassword ?? _dummyHash;
        bool passwordValid = PasswordHelper.VerifyPassword(command.Password, hashToVerify);

        if (user == null || user.UserID == null || !passwordValid)
        {
            // Record failed attempt for lockout tracking
            if (user != null && user.UserID.HasValue)
            {
                await _accountLockout.RecordFailedAttemptAsync(user.UserID.Value, cancellationToken);
            }

            return Failure(AuthCommandFailureReason.InvalidCredentials, "Invalid email/phone or password.");
        }

        if (user.IsDeleted)
        {
            return Failure(AuthCommandFailureReason.UserDeleted, "User account is deleted.");
        }

        if (user.Status != UserStatusPolicy.Active)
        {
            return Failure(AuthCommandFailureReason.UserInactive, "User account is banned or inactive.");
        }

        if (user.SuspendedUntil.HasValue && user.SuspendedUntil.Value > DateTime.UtcNow)
        {
            string until = user.SuspendedUntil.Value.ToString("yyyy-MM-dd HH:mm") + " UTC";
            return Failure(AuthCommandFailureReason.UserInactive, $"Your account is suspended until {until}. Please try again later.");
        }

        if (PasswordHelper.NeedsRehash(user.HashedPassword))
        {
            try
            {
                user = user with { HashedPassword = PasswordHelper.HashPassword(command.Password) };
                await _users.UpdateUserAsync(user, user.UserID.Value, cancellationToken);
            }
            catch (Exception ex)
            {
                // Authentication should not fail because opportunistic hash upgrade failed.
                _logger.LogWarning(ex, "Opportunistic password hash upgrade failed for user {UserId}.", user.UserID);
            }
        }

        // Clear lockout on successful authentication
        await _accountLockout.ClearLockoutAsync(user.UserID!.Value, cancellationToken);

        string? roleName = await ResolveRoleNameForTokenAsync(user.RoleID, cancellationToken);
        if (string.IsNullOrWhiteSpace(roleName))
        {
            return Failure(AuthCommandFailureReason.RoleResolutionFailed, "Unable to resolve user role for authentication.");
        }

        return new AuthCommandResult
        {
            Success = true,
            User = user,
            RoleName = roleName
        };
    }

    public async Task<AuthCommandResult> SignupAsync(SignupCommand command, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(command.Password) || string.IsNullOrWhiteSpace(command.FirstName))
        {
            return Failure(AuthCommandFailureReason.InvalidRequest, "Invalid signup data. Password and first name are required.");
        }

        var (isPasswordValid, passwordError) = PasswordHelper.IsPasswordPolicyCompliant(command.Password);
        if (!isPasswordValid)
        {
            return Failure(AuthCommandFailureReason.InvalidRequest, passwordError!);
        }

        string? normalizedEmail = NormalizeEmail(command.Email);
        string? normalizedPhone = PhoneNumberNormalizer.NormalizeJordanPhone(command.Phone) ??
                                  PhoneNumberNormalizer.NormalizeJordanPhone(command.Email);
        bool isPhoneOnlySignup = string.IsNullOrWhiteSpace(normalizedEmail) && !string.IsNullOrWhiteSpace(normalizedPhone);

        if (string.IsNullOrWhiteSpace(normalizedEmail) && string.IsNullOrWhiteSpace(normalizedPhone))
        {
            return Failure(AuthCommandFailureReason.InvalidRequest, "Email or phone number is required.");
        }

        if (command.AreaId.HasValue && !command.CityId.HasValue)
        {
            return Failure(AuthCommandFailureReason.InvalidRequest, "CityId is required when AreaId is provided.");
        }

        if (command.CityId.HasValue || command.AreaId.HasValue)
        {
            (bool isValid, string validationMessage) = await ValidateLocationSelectionAsync(
                command.CityId,
                command.AreaId,
                cancellationToken);
            if (!isValid)
            {
                return Failure(AuthCommandFailureReason.InvalidRequest, validationMessage);
            }
        }

        if (!string.IsNullOrWhiteSpace(command.Avatar) && !ValidationHelpers.IsValidAvatarUrl(command.Avatar))
        {
            return Failure(AuthCommandFailureReason.InvalidRequest, "Avatar must be a valid http or https URL.");
        }

        if (string.IsNullOrWhiteSpace(normalizedEmail) && !string.IsNullOrWhiteSpace(normalizedPhone))
        {
            normalizedEmail = BuildPhoneAliasEmail(normalizedPhone!);
        }

        // Use the shared RoleResolution helper — eliminates the private duplicate method.
        int? defaultRoleId = await RoleResolution.ResolveRoleIdByNameAsync(_roles, _logger, DefaultUserRoleName, cancellationToken);
        if (!defaultRoleId.HasValue)
        {
            return Failure(AuthCommandFailureReason.RoleResolutionFailed, "Unable to resolve default user role.");
        }

        var user = new UserModel(
            null,
            PasswordHelper.HashPassword(command.Password),
            normalizedEmail!,
            command.FirstName.Trim(),
            command.LastName?.Trim() ?? string.Empty,
            normalizedPhone,
            command.CityId,
            command.AreaId,
            string.IsNullOrWhiteSpace(command.Bio) ? null : command.Bio.Trim(),
            string.IsNullOrWhiteSpace(command.Avatar) ? null : command.Avatar.Trim(),
            DateTime.UtcNow,
            UserStatusPolicy.Active,
            defaultRoleId.Value,
            false
        );

        try
        {
            int newUserId = await _users.AddUserAsync(user, cancellationToken);
            if (newUserId <= 0)
            {
                return Failure(AuthCommandFailureReason.PersistenceFailed, "Error creating user account. Please try again.");
            }
            user = user with { UserID = newUserId };

            string? roleName = await ResolveRoleNameForTokenAsync(user.RoleID, cancellationToken);
            if (string.IsNullOrWhiteSpace(roleName))
            {
                return Failure(AuthCommandFailureReason.RoleResolutionFailed, "Unable to resolve user role for authentication.");
            }

            return new AuthCommandResult
            {
                Success = true,
                User = user,
                RoleName = roleName
            };
        }
        catch (Exception ex) when (LooksLikeDuplicateIdentity(ex.Message))
        {
            if (_logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation(
                    "Signup rejected due to duplicate identity. email={Email} phone={Phone}",
                    normalizedEmail,
                    normalizedPhone);
            }
            return Failure(AuthCommandFailureReason.DuplicateIdentity, ResolveDuplicateIdentityMessage(ex.Message, isPhoneOnlySignup));
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Signup persistence failed. email={Email} phone={Phone}",
                normalizedEmail,
                normalizedPhone
            );
            return Failure(AuthCommandFailureReason.PersistenceFailed, "An error occurred while creating your account. Please try again.");
        }
    }

    public async Task<AuthCommandResult> GoogleAuthAsync(
        GoogleAuthCommand command,
        CancellationToken cancellationToken = default)
    {
        string? normalizedEmail = NormalizeEmail(command.Email);
        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            return Failure(AuthCommandFailureReason.InvalidRequest, "Google account email is required.");
        }

        string normalizedSubject = command.Subject?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(normalizedSubject))
        {
            return Failure(AuthCommandFailureReason.InvalidRequest, "Google account identity is missing.");
        }

        int? linkedUserId = await _externalIdentities.FindUserIdByProviderSubjectAsync(
            GoogleProviderName,
            normalizedSubject,
            cancellationToken
        );
        if (linkedUserId.HasValue)
        {
            UserModel? linkedUser = await _users.GetUserByIDAsync(linkedUserId.Value, cancellationToken);
            if (linkedUser == null || linkedUser.UserID == null)
            {
                _logger.LogWarning(
                    "Google identity mapping points to missing user. provider={Provider} subject={Subject} userId={UserId}",
                    GoogleProviderName,
                    normalizedSubject,
                    linkedUserId.Value
                );
                return Failure(
                    AuthCommandFailureReason.PersistenceFailed,
                    "Google sign-in account mapping is invalid. Please contact support."
                );
            }

            return await BuildGoogleSuccessResultAsync(linkedUser, command, cancellationToken);
        }

        UserModel? emailMatchedUser = await _users.GetUserByLoginAsync(normalizedEmail, cancellationToken);
        if (emailMatchedUser != null && emailMatchedUser.UserID != null)
        {
            GoogleIdentityLinkResolution linkResolution = await ResolveGoogleIdentityLinkAsync(
                emailMatchedUser.UserID.Value,
                normalizedSubject,
                normalizedEmail,
                cancellationToken
            );
            if (linkResolution.Failure != null)
            {
                return linkResolution.Failure;
            }

            return await ResolveGoogleAuthUserFromLinkAsync(
                emailMatchedUser,
                linkResolution,
                command,
                cancellationToken
            );
        }

        string firstName = ResolveGoogleFirstName(command.FirstName, command.Email);
        string lastName = string.IsNullOrWhiteSpace(command.LastName) ? string.Empty : command.LastName.Trim();

        AuthCommandResult signupResult = await SignupAsync(new SignupCommand
        {
            Email = normalizedEmail,
            Password = GenerateExternalAuthPassword(),
            FirstName = firstName,
            LastName = lastName,
            Avatar = command.Avatar
        }, cancellationToken);

        if (signupResult.Success)
        {
            if (signupResult.User == null || signupResult.User.UserID == null)
            {
                return Failure(AuthCommandFailureReason.PersistenceFailed, "Google account was created but could not be loaded.");
            }

            GoogleIdentityLinkResolution signupLinkResolution = await ResolveGoogleIdentityLinkAsync(
                signupResult.User.UserID.Value,
                normalizedSubject,
                normalizedEmail,
                cancellationToken
            );
            if (signupLinkResolution.Failure != null)
            {
                return signupLinkResolution.Failure;
            }

            return await ResolveGoogleAuthUserFromLinkAsync(
                signupResult.User,
                signupLinkResolution,
                command,
                cancellationToken
            );
        }

        if (signupResult.FailureReason == AuthCommandFailureReason.DuplicateIdentity)
        {
            UserModel? userAfterDuplicate = await _users.GetUserByLoginAsync(normalizedEmail, cancellationToken);
            if (userAfterDuplicate != null &&
                userAfterDuplicate.UserID != null &&
                !userAfterDuplicate.IsDeleted &&
                userAfterDuplicate.Status == UserStatusPolicy.Active)
            {
                GoogleIdentityLinkResolution duplicateLinkResolution = await ResolveGoogleIdentityLinkAsync(
                    userAfterDuplicate.UserID.Value,
                    normalizedSubject,
                    normalizedEmail,
                    cancellationToken
                );
                if (duplicateLinkResolution.Failure != null)
                {
                    return duplicateLinkResolution.Failure;
                }

                return await ResolveGoogleAuthUserFromLinkAsync(
                    userAfterDuplicate,
                    duplicateLinkResolution,
                    command,
                    cancellationToken
                );
            }
        }

        return signupResult;
    }

    private async Task<AuthCommandResult> ResolveGoogleAuthUserFromLinkAsync(
        UserModel fallbackUser,
        GoogleIdentityLinkResolution linkResolution,
        GoogleAuthCommand command,
        CancellationToken cancellationToken)
    {
        if (linkResolution.LinkedUserId.HasValue &&
            fallbackUser.UserID.HasValue &&
            linkResolution.LinkedUserId.Value != fallbackUser.UserID.Value)
        {
            UserModel? linkedUser = await _users.GetUserByIDAsync(linkResolution.LinkedUserId.Value, cancellationToken);
            if (linkedUser == null || linkedUser.UserID == null)
            {
                return Failure(
                    AuthCommandFailureReason.PersistenceFailed,
                    "Google account mapping could not be resolved. Please try again."
                );
            }

            return await BuildGoogleSuccessResultAsync(linkedUser, command, cancellationToken);
        }

        return await BuildGoogleSuccessResultAsync(fallbackUser, command, cancellationToken);
    }

    private async Task<GoogleIdentityLinkResolution> ResolveGoogleIdentityLinkAsync(
        int userId,
        string normalizedSubject,
        string normalizedEmail,
        CancellationToken cancellationToken)
    {
        ExternalIdentityLinkResult linkResult = await _externalIdentities.LinkIdentityToUserAsync(
            userId,
            GoogleProviderName,
            normalizedSubject,
            normalizedEmail,
            cancellationToken
        );

        return linkResult.Status switch
        {
            ExternalIdentityLinkStatus.Linked => new GoogleIdentityLinkResolution(userId, null),
            ExternalIdentityLinkStatus.AlreadyLinkedToSameUser => new GoogleIdentityLinkResolution(userId, null),
            ExternalIdentityLinkStatus.LinkedToAnotherUser => new GoogleIdentityLinkResolution(linkResult.LinkedUserId, null),
            ExternalIdentityLinkStatus.InvalidRequest => new GoogleIdentityLinkResolution(
                null,
                Failure(AuthCommandFailureReason.InvalidRequest, "Google account identity is invalid.")
            ),
            _ => new GoogleIdentityLinkResolution(
                null,
                Failure(AuthCommandFailureReason.PersistenceFailed, "Unable to secure Google account mapping. Please try again.")
            )
        };
    }

    private async Task<AuthCommandResult> BuildGoogleSuccessResultAsync(
        UserModel user,
        GoogleAuthCommand command,
        CancellationToken cancellationToken)
    {
        AuthCommandResult? userStateFailure = ValidateGoogleUserState(user);
        if (userStateFailure != null)
        {
            return userStateFailure;
        }

        user = await TryHydrateGoogleProfileAsync(
            user,
            command.FirstName,
            command.LastName,
            command.Avatar,
            cancellationToken
        );

        string? roleName = await ResolveRoleNameForTokenAsync(user.RoleID, cancellationToken);
        if (string.IsNullOrWhiteSpace(roleName))
        {
            return Failure(AuthCommandFailureReason.RoleResolutionFailed, "Unable to resolve user role for authentication.");
        }

        return new AuthCommandResult
        {
            Success = true,
            User = user,
            RoleName = roleName
        };
    }

    private static AuthCommandResult? ValidateGoogleUserState(UserModel user)
    {
        if (user.UserID == null)
        {
            return Failure(AuthCommandFailureReason.PersistenceFailed, "User account could not be loaded.");
        }

        if (user.IsDeleted)
        {
            return Failure(AuthCommandFailureReason.UserDeleted, "User account is deleted.");
        }

        if (user.Status != UserStatusPolicy.Active)
        {
            return Failure(AuthCommandFailureReason.UserInactive, "User account is banned or inactive.");
        }

        return null;
    }

    private sealed class GoogleIdentityLinkResolution(int? linkedUserId, AuthCommandResult? failure)
    {
        public int? LinkedUserId { get; } = linkedUserId;
        public AuthCommandResult? Failure { get; } = failure;
    }

    private static string? NormalizeEmail(string? email)
    {
        return string.IsNullOrWhiteSpace(email) ? null : email.Trim().ToLowerInvariant();
    }

    private static string BuildPhoneAliasEmail(string normalizedPhone)
    {
        string digitsOnly = new([.. normalizedPhone.Where(char.IsDigit)]);
        return $"phone_{digitsOnly}@tijarahjo.local";
    }



    private async Task<string?> ResolveRoleNameForTokenAsync(int roleId, CancellationToken cancellationToken)
    {
        Role? role = await _roles.FindAsync(roleId, cancellationToken);
        if (role == null || role.IsDeleted || string.IsNullOrWhiteSpace(role.RoleName))
        {
            return null;
        }

        return role.RoleName.Trim();
    }

    private async Task<UserModel> TryHydrateGoogleProfileAsync(
        UserModel user,
        string? firstName,
        string? lastName,
        string? avatar,
        CancellationToken cancellationToken)
    {
        bool changed = false;

        if (string.IsNullOrWhiteSpace(user.FirstName) && !string.IsNullOrWhiteSpace(firstName))
        {
            user = user with { FirstName = firstName.Trim() };
            changed = true;
        }

        if (string.IsNullOrWhiteSpace(user.LastName) && !string.IsNullOrWhiteSpace(lastName))
        {
            user = user with { LastName = lastName.Trim() };
            changed = true;
        }

        string? normalizedGoogleAvatar =
            !string.IsNullOrWhiteSpace(avatar) && ValidationHelpers.IsValidAvatarUrl(avatar)
                ? avatar.Trim()
                : null;
        string? currentAvatar = user.Avatar?.Trim();
        bool shouldRefreshExternalAvatar =
            normalizedGoogleAvatar != null &&
            (ValidationHelpers.IsMissingOrInvalidAvatar(currentAvatar) ||
             (!ValidationHelpers.IsStoredUploadAvatar(currentAvatar) &&
              !string.Equals(currentAvatar, normalizedGoogleAvatar, StringComparison.Ordinal)));

        if (shouldRefreshExternalAvatar)
        {
            user = user with { Avatar = normalizedGoogleAvatar };
            changed = true;
        }

        if (!changed)
        {
            return user;
        }

        try
        {
            await _users.UpdateUserAsync(user, user.UserID!.Value, cancellationToken);
        }
        catch (Exception)
        {
            if (_logger.IsEnabled(LogLevel.Debug))
            {
                _logger.LogDebug("Google profile hydration failed for user {UserId}.", user.UserID);
            }
        }

        return user;
    }

    private static string ResolveGoogleFirstName(string? firstName, string? email)
    {
        if (!string.IsNullOrWhiteSpace(firstName))
        {
            return firstName.Trim();
        }

        string emailLocalPart = string.IsNullOrWhiteSpace(email)
            ? string.Empty
            : email.Split('@', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(emailLocalPart))
        {
            return "Google";
        }

        string normalized = emailLocalPart
            .Replace(".", " ", StringComparison.Ordinal)
            .Replace("_", " ", StringComparison.Ordinal)
            .Replace("-", " ", StringComparison.Ordinal)
            .Trim();

        return string.IsNullOrWhiteSpace(normalized) ? "Google" : normalized;
    }

    private static string GenerateExternalAuthPassword()
    {
        // Password is not user-facing for OAuth-created users; generate strong random bytes.
        string random = Convert.ToBase64String(RandomNumberGenerator.GetBytes(24));
        return $"G!{random}a9";
    }

    private static bool LooksLikeDuplicateIdentity(string? message)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            return false;
        }

        string upper = message.ToUpperInvariant();
        return upper.Contains("2627", StringComparison.Ordinal) ||
               upper.Contains("2601", StringComparison.Ordinal) ||
               upper.Contains("UNIQUE", StringComparison.Ordinal) ||
               upper.Contains("DUPLICATE", StringComparison.Ordinal);
    }

    private static string ResolveDuplicateIdentityMessage(string sqlMessage, bool isPhoneOnlySignup)
    {
        string errorMsgUpper = sqlMessage.ToUpperInvariant();
        bool isEmailConstraintViolation =
            errorMsgUpper.Contains("UQ_USERS_EMAIL", StringComparison.Ordinal) ||
            errorMsgUpper.Contains("IX_USERS_LOGIN_EMAIL_ACTIVE", StringComparison.Ordinal) ||
            (errorMsgUpper.Contains("EMAIL", StringComparison.Ordinal) && errorMsgUpper.Contains("UNIQUE", StringComparison.Ordinal));
        bool isPhoneConstraintViolation =
            errorMsgUpper.Contains("UQ_USERS_PHONE_ACTIVE", StringComparison.Ordinal) ||
            (errorMsgUpper.Contains("PHONE", StringComparison.Ordinal) && errorMsgUpper.Contains("UNIQUE", StringComparison.Ordinal));

        if (isPhoneConstraintViolation)
        {
            return "An account with this phone number already exists. Please use a different phone number or try logging in.";
        }

        if (isEmailConstraintViolation)
        {
            return "An account with this email address already exists. Please use a different email or try logging in.";
        }

        return isPhoneOnlySignup
            ? "An account with this phone number already exists. Please use a different phone number or try logging in."
            : "An account with this information already exists. Please check your details and try again.";
    }

    private async Task<(bool IsValid, string Message)> ValidateLocationSelectionAsync(
        int? cityId,
        int? areaId,
        CancellationToken cancellationToken)
    {
        if (!cityId.HasValue)
        {
            return (true, string.Empty);
        }

        if (cityId.Value < 1)
        {
            return (false, "CityId must be a positive integer.");
        }

        IReadOnlyList<CityLookupResult> cities = await _locations.GetCitiesAsync(cancellationToken);
        bool cityExists = cities.Any(city => city.CityId == cityId.Value);
        if (!cityExists)
        {
            return (false, "Selected city is invalid.");
        }

        if (!areaId.HasValue)
        {
            return (true, string.Empty);
        }

        if (areaId.Value < 1)
        {
            return (false, "AreaId must be a positive integer.");
        }

        IReadOnlyList<AreaLookupResult> areas = await _locations.GetAreasByCityAsync(cityId.Value, cancellationToken);
        bool areaBelongsToCity = areas.Any(area => area.AreaId == areaId.Value);
        if (!areaBelongsToCity)
        {
            return (false, "Selected area does not belong to the selected city.");
        }

        return (true, string.Empty);
    }

    private static AuthCommandResult Failure(AuthCommandFailureReason reason, string message)
    {
        return new AuthCommandResult
        {
            Success = false,
            FailureReason = reason,
            Message = message
        };
    }
}
