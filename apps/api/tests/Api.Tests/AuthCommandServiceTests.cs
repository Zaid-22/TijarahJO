using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Services;
using TijarahJo.Application.Common;

namespace TijarahJo.Api.Tests;

/// <summary>
/// Unit tests for <see cref="AuthCommandService"/>.
/// Uses an in-process fake for all dependencies — no database required.
/// </summary>
public sealed class AuthCommandServiceTests
{
    // -------------------------------------------------------------------------
    // LoginAsync
    // -------------------------------------------------------------------------

    [Fact]
    public async Task LoginAsync_ReturnsBadRequest_WhenCredentialsAreBlank()
    {
        var service = BuildService();

        AuthCommandResult result = await service.LoginAsync(new LoginCommand { Login = "", Password = "" });

        Assert.False(result.Success);
        Assert.Equal(AuthCommandFailureReason.InvalidRequest, result.FailureReason);
    }

    [Fact]
    public async Task LoginAsync_ReturnsInvalidCredentials_WhenUserNotFound()
    {
        var service = BuildService(nextFindUser: null);

        AuthCommandResult result = await service.LoginAsync(new LoginCommand
        {
            Login = "nobody@example.com",
            Password = "any-password"
        });

        Assert.False(result.Success);
        Assert.Equal(AuthCommandFailureReason.InvalidCredentials, result.FailureReason);
    }

    [Fact]
    public async Task LoginAsync_ReturnsInvalidCredentials_WhenPasswordWrong()
    {
        // Register a user with a known hashed password
        var hashedCorrectPassword = TijarahJo.Application.Common.PasswordHelper.HashPassword("correct-password");
        var service = BuildService(hashedPassword: hashedCorrectPassword);

        AuthCommandResult result = await service.LoginAsync(new LoginCommand
        {
            Login = "user@example.com",
            Password = "wrong-passw0rd!X"
        });

        Assert.False(result.Success);
        Assert.Equal(AuthCommandFailureReason.InvalidCredentials, result.FailureReason);
    }

    [Fact]
    public async Task LoginAsync_ReturnsInvalidCredentials_WhenUserIsSoftDeleted()
    {
        var hash = TijarahJo.Application.Common.PasswordHelper.HashPassword("Test1234!");
        var service = BuildService(hashedPassword: hash, isDeleted: true);

        AuthCommandResult result = await service.LoginAsync(new LoginCommand
        {
            Login = "user@example.com",
            Password = "Test1234!"
        });

        Assert.False(result.Success);
        Assert.Equal(AuthCommandFailureReason.InvalidCredentials, result.FailureReason);
    }

    [Fact]
    public async Task LoginAsync_ReturnsUserInactive_WhenUserIsBanned()
    {
        var hash = TijarahJo.Application.Common.PasswordHelper.HashPassword("Test1234!");
        // Status = 2 means banned/inactive (Active = 1 per UserStatusPolicy)
        var service = BuildService(hashedPassword: hash, status: 2);

        AuthCommandResult result = await service.LoginAsync(new LoginCommand
        {
            Login = "user@example.com",
            Password = "Test1234!"
        });

        Assert.False(result.Success);
        Assert.Equal(AuthCommandFailureReason.UserInactive, result.FailureReason);
    }

    [Fact]
    public async Task LoginAsync_ReturnsSuccess_WhenCredentialsAreValid()
    {
        var hash = TijarahJo.Application.Common.PasswordHelper.HashPassword("Test1234!");
        var service = BuildService(hashedPassword: hash);

        AuthCommandResult result = await service.LoginAsync(new LoginCommand
        {
            Login = "user@example.com",
            Password = "Test1234!"
        });

        Assert.True(result.Success);
        Assert.NotNull(result.User);
        Assert.Equal("User", result.RoleName);
    }

    // -------------------------------------------------------------------------
    // SignupAsync
    // -------------------------------------------------------------------------

    [Fact]
    public async Task SignupAsync_ReturnsInvalidRequest_WhenFirstNameMissing()
    {
        var service = BuildService();

        AuthCommandResult result = await service.SignupAsync(new SignupCommand
        {
            Password = "Test1234!",
            FirstName = "",
            Email = "a@b.com"
        });

        Assert.False(result.Success);
        Assert.Equal(AuthCommandFailureReason.InvalidRequest, result.FailureReason);
    }

    [Fact]
    public async Task SignupAsync_ReturnsInvalidRequest_WhenNoEmailOrPhone()
    {
        var service = BuildService();

        AuthCommandResult result = await service.SignupAsync(new SignupCommand
        {
            Password = "Test1234!",
            FirstName = "Test",
            Email = null,
            Phone = null
        });

        Assert.False(result.Success);
        Assert.Equal(AuthCommandFailureReason.InvalidRequest, result.FailureReason);
    }

    [Fact]
    public async Task SignupAsync_ReturnsInvalidRequest_WhenAreaIdWithoutCityId()
    {
        var service = BuildService();

        AuthCommandResult result = await service.SignupAsync(new SignupCommand
        {
            Password = "Test1234!",
            FirstName = "Test",
            Email = "a@b.com",
            AreaId = 5,
            CityId = null
        });

        Assert.False(result.Success);
        Assert.Equal(AuthCommandFailureReason.InvalidRequest, result.FailureReason);
    }

    [Fact]
    public async Task SignupAsync_ReturnsInvalidRequest_WhenAvatarIsNotHttps()
    {
        var service = BuildService();

        AuthCommandResult result = await service.SignupAsync(new SignupCommand
        {
            Password = "Test1234!",
            FirstName = "Test",
            Email = "a@b.com",
            Avatar = "javascript:alert(1)"
        });

        Assert.False(result.Success);
        Assert.Equal(AuthCommandFailureReason.InvalidRequest, result.FailureReason);
    }

    [Fact]
    public async Task SignupAsync_ReturnsInvalidRequest_WhenCityIsInvalid()
    {
        var service = BuildService();

        AuthCommandResult result = await service.SignupAsync(new SignupCommand
        {
            Password = "Test1234!",
            FirstName = "Test",
            Email = "a@b.com",
            CityId = 9999
        });

        Assert.False(result.Success);
        Assert.Equal(AuthCommandFailureReason.InvalidRequest, result.FailureReason);
    }

    [Fact]
    public async Task SignupAsync_ReturnsInvalidRequest_WhenAreaDoesNotBelongToCity()
    {
        var service = BuildService();

        AuthCommandResult result = await service.SignupAsync(new SignupCommand
        {
            Password = "Test1234!",
            FirstName = "Test",
            Email = "a@b.com",
            CityId = 1,
            AreaId = 99
        });

        Assert.False(result.Success);
        Assert.Equal(AuthCommandFailureReason.InvalidRequest, result.FailureReason);
    }

    [Fact]
    public async Task SignupAsync_ReturnsSuccess_WithValidData()
    {
        var service = BuildService();

        AuthCommandResult result = await service.SignupAsync(new SignupCommand
        {
            Password = "Test1234!",
            FirstName = "Test",
            Email = "newuser@example.com"
        });

        Assert.True(result.Success);
        Assert.NotNull(result.User);
        Assert.Equal("User", result.RoleName);
    }

    [Fact]
    public async Task SignupAsync_ReturnsRegistrationDisabled_WhenRegistrationIsDisabled()
    {
        var service = BuildService(registrationEnabled: false);

        AuthCommandResult result = await service.SignupAsync(new SignupCommand
        {
            Password = "Test1234!",
            FirstName = "Test",
            Email = "newuser@example.com"
        });

        Assert.False(result.Success);
        Assert.Equal(AuthCommandFailureReason.RegistrationDisabled, result.FailureReason);
    }

    // -------------------------------------------------------------------------
    // GoogleAuthAsync
    // -------------------------------------------------------------------------

    [Fact]
    public async Task GoogleAuthAsync_RefreshesExternalAvatar_WhenGooglePictureChanges()
    {
        var account = CreateDefaultUser(avatar: "https://lh3.googleusercontent.com/old-photo");
        var (service, users) = BuildServiceWithAccount(account);

        AuthCommandResult result = await service.GoogleAuthAsync(new GoogleAuthCommand
        {
            Subject = "google-subject-1",
            Email = "user@example.com",
            FirstName = "Test",
            LastName = "User",
            Avatar = "https://lh3.googleusercontent.com/new-photo"
        });

        Assert.True(result.Success);
        Assert.NotNull(result.User);
        Assert.Equal("https://lh3.googleusercontent.com/new-photo", result.User.Avatar);
        Assert.NotNull(users.UpdatedUser);
        Assert.Equal("https://lh3.googleusercontent.com/new-photo", users.UpdatedUser.Avatar);
    }

    [Fact]
    public async Task GoogleAuthAsync_KeepsUploadedAvatar_WhenGooglePictureChanges()
    {
        var account = CreateDefaultUser(avatar: "/uploads/user-avatars/custom.webp");
        var (service, users) = BuildServiceWithAccount(account);

        AuthCommandResult result = await service.GoogleAuthAsync(new GoogleAuthCommand
        {
            Subject = "google-subject-1",
            Email = "user@example.com",
            FirstName = "Test",
            LastName = "User",
            Avatar = "https://lh3.googleusercontent.com/new-photo"
        });

        Assert.True(result.Success);
        Assert.NotNull(result.User);
        Assert.Equal("/uploads/user-avatars/custom.webp", result.User.Avatar);
        Assert.Null(users.UpdatedUser);
    }

    [Fact]
    public async Task GoogleAuthAsync_KeepsUploadAvatarWithoutLeadingSlash_WhenGooglePictureChanges()
    {
        var account = CreateDefaultUser(avatar: "uploads/user-avatars/custom.webp");
        var (service, users) = BuildServiceWithAccount(account);

        AuthCommandResult result = await service.GoogleAuthAsync(new GoogleAuthCommand
        {
            Subject = "google-subject-1",
            Email = "user@example.com",
            FirstName = "Test",
            LastName = "User",
            Avatar = "https://lh3.googleusercontent.com/new-photo"
        });

        Assert.True(result.Success);
        Assert.NotNull(result.User);
        Assert.Equal("uploads/user-avatars/custom.webp", result.User.Avatar);
        Assert.Null(users.UpdatedUser);
    }

    [Fact]
    public async Task GoogleAuthAsync_RejectsCurrentlySuspendedAccount()
    {
        var account = CreateDefaultUser(suspendedUntil: DateTime.UtcNow.AddHours(1));
        var (service, _) = BuildServiceWithAccount(account);

        AuthCommandResult result = await service.GoogleAuthAsync(new GoogleAuthCommand
        {
            Subject = "google-suspended-user",
            Email = account.Email,
            FirstName = account.FirstName,
            LastName = account.LastName
        });

        Assert.False(result.Success);
        Assert.Equal(AuthCommandFailureReason.UserInactive, result.FailureReason);
    }

    [Fact]
    public async Task GoogleAuthAsync_MarksProviderVerifiedEmailWithoutChangingLoginOutcome()
    {
        var account = CreateDefaultUser(isEmailVerified: false);
        var (service, users) = BuildServiceWithAccount(account);

        AuthCommandResult result = await service.GoogleAuthAsync(new GoogleAuthCommand
        {
            Subject = "google-first-login",
            Email = account.Email,
            FirstName = account.FirstName,
            LastName = account.LastName
        });

        Assert.True(result.Success);
        Assert.True(result.User!.IsEmailVerified);
        Assert.True(users.UpdatedUser!.IsEmailVerified);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private static UserModel CreateDefaultUser(
        string? hashedPassword = null,
        bool isDeleted = false,
        int status = 1 /* Active */,
        string? avatar = null,
        DateTime? suspendedUntil = null,
        bool isEmailVerified = true)
    {
        return new UserModel(
            userid: 1,
            hashedpassword: hashedPassword ?? TijarahJo.Application.Common.PasswordHelper.HashPassword("Test1234!"),
            email: "user@example.com",
            firstname: "Test",
            lastname: "User",
            phone: null,
            cityId: null,
            areaId: null,
            bio: null,
            avatar: avatar,
            joindate: DateTime.UtcNow,
            status: status,
            roleid: 1,
            isdeleted: isDeleted,
            suspendedUntil: suspendedUntil,
            isEmailVerified: isEmailVerified
        );
    }

    private static AuthCommandService BuildService(
        UserModel? nextFindUser = null,
        string? hashedPassword = null,
        bool isDeleted = false,
        int status = 1 /* Active */,
        bool registrationEnabled = true)
    {
        var model = CreateDefaultUser(
            hashedPassword: hashedPassword,
            isDeleted: isDeleted,
            status: status);

        var account = nextFindUser ?? model;

        return BuildServiceWithAccount(account, registrationEnabled: registrationEnabled).Service;
    }

    private static (AuthCommandService Service, FakeUserDataAccess Users) BuildServiceWithAccount(
        UserModel account,
        bool registrationEnabled = true)
    {
        var users = new FakeUserDataAccess(account);
        var externalIdentities = new FakeExternalIdentityDataAccess();
        var roles = new FakeRoleService();
        var locations = new FakeLocationReadService();
        var lockout = new FakeAccountLockoutService();
        var systemSettings = new FakeSystemSettingsRuntimeService(registrationEnabled);
        var logger = Microsoft.Extensions.Logging.Abstractions.NullLogger<AuthCommandService>.Instance;

        return (new AuthCommandService(users, externalIdentities, roles, locations, lockout, systemSettings, logger), users);
    }

    // -------------------------------------------------------------------------
    // Fakes
    // -------------------------------------------------------------------------

    private sealed class FakeUserDataAccess : IUserDataAccess
    {
        private readonly UserModel _account;
        private bool _saveResult = true;

        public FakeUserDataAccess(UserModel account) => _account = account;

        public UserModel? UpdatedUser { get; private set; }

        public Task<UserModel?> GetUserByIDAsync(int? userId, CancellationToken ct = default)
            => Task.FromResult<UserModel?>(userId == _account.UserID ? _account : null);

        public Task<UserModel?> GetUserByLoginAsync(string login, CancellationToken ct = default)
        {
            if (_account.IsDeleted) return Task.FromResult<UserModel?>(null);

            bool matches = string.Equals(login, _account.Email, StringComparison.OrdinalIgnoreCase) ||
                           (!string.IsNullOrWhiteSpace(_account.Phone) && string.Equals(login, _account.Phone, StringComparison.OrdinalIgnoreCase));

            return Task.FromResult<UserModel?>(matches ? _account : null);
        }

        public async Task<UserModel?> GetUserByLoginCandidatesAsync(IReadOnlyList<string> candidates, CancellationToken ct = default)
        {
            foreach (var c in candidates)
            {
                var u = await GetUserByLoginAsync(c, ct);
                if (u != null) return u;
            }
            return null;
        }

        public Task<int> AddUserAsync(UserModel user, CancellationToken ct = default)
            => Task.FromResult(_saveResult ? 1 : 0);

        public Task<bool> UpdateUserAsync(UserModel user, int actorUserId, CancellationToken ct = default)
        {
            UpdatedUser = user;
            return Task.FromResult(_saveResult);
        }

        public Task<bool> DeleteUserAsync(int? userId, int actorUserId, CancellationToken ct = default)
            => Task.FromResult(true);

        public Task<bool> DoesUserExistAsync(int? userId, CancellationToken ct = default)
            => Task.FromResult(true);

        public Task<IReadOnlyList<UserModel>> GetAllUsersAsync(int page = 1, int size = 50, CancellationToken ct = default)
            => Task.FromResult<IReadOnlyList<UserModel>>(Array.Empty<UserModel>());
    }

    private sealed class FakeExternalIdentityDataAccess : IExternalIdentityDataAccess
    {
        public Task<int?> FindUserIdByProviderSubjectAsync(
            string provider,
            string providerSubject,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult<int?>(null);
        }

        public Task<ExternalIdentityLinkResult> LinkIdentityToUserAsync(
            int userId,
            string provider,
            string providerSubject,
            string? providerEmail,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult(new ExternalIdentityLinkResult
            {
                Status = ExternalIdentityLinkStatus.Linked,
                LinkedUserId = userId
            });
        }

        public Task DeleteIdentityLinkBySubjectAsync(
            string provider,
            string providerSubject,
            CancellationToken cancellationToken = default)
        {
            return Task.CompletedTask;
        }
    }

    private sealed class FakeRoleService : IRoleService
    {
        private static readonly RoleModel DefaultRole = new RoleModel(1, "User", DateTime.UtcNow, false);

        public Task<IReadOnlyList<RoleModel>> GetAllRolesAsync(CancellationToken ct = default)
            => Task.FromResult<IReadOnlyList<RoleModel>>(new[] { DefaultRole });

        public Task<Role?> FindAsync(int? roleId, CancellationToken ct = default)
            => Task.FromResult<Role?>(new Role(DefaultRole, Role.ModeType.Update));

        public Role Create(RoleModel model) => new(model);

        public Task<bool> SaveAsync(Role role, CancellationToken ct = default)
            => Task.FromResult(true);

        public Task<bool> DeleteRoleAsync(int? roleId, CancellationToken ct = default)
            => Task.FromResult(true);

        public Task<bool> DoesRoleExistAsync(int? roleId, CancellationToken ct = default)
            => Task.FromResult(true);

        public Task<bool> IsRoleNameTakenAsync(string roleName, int? excludeRoleId = null, CancellationToken ct = default)
            => Task.FromResult(false);
    }

    private sealed class FakeLocationReadService : ILocationReadService
    {
        private static readonly CityLookupResult[] Cities =
        {
            new() { CityId = 1, CityName = "Amman" },
            new() { CityId = 2, CityName = "Irbid" }
        };

        private static readonly AreaLookupResult[] Areas =
        {
            new() { AreaId = 1, AreaName = "West Amman", CityId = 1 },
            new() { AreaId = 2, AreaName = "City Center", CityId = 2 }
        };

        public Task<IReadOnlyList<CityLookupResult>> GetCitiesAsync(CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<CityLookupResult>>(Cities);

        public Task<IReadOnlyList<AreaLookupResult>> GetAreasByCityAsync(int cityId, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<AreaLookupResult>>(Areas.Where(area => area.CityId == cityId).ToArray());
    }

    private sealed class FakeAccountLockoutService : IAccountLockoutService
    {
        public Task<AccountLockoutResult> IsLockedOutAsync(int userId, CancellationToken cancellationToken = default)
            => Task.FromResult(new AccountLockoutResult(false));

        public Task<AccountLockoutResult> RecordFailedAttemptAsync(int userId, CancellationToken cancellationToken = default)
            => Task.FromResult(new AccountLockoutResult(false));

        public Task ClearLockoutAsync(int userId, CancellationToken cancellationToken = default)
            => Task.CompletedTask;
    }

    private sealed class FakeSystemSettingsRuntimeService : ISystemSettingsRuntimeService
    {
        private readonly bool _registrationEnabled;

        public FakeSystemSettingsRuntimeService(bool registrationEnabled = true)
        {
            _registrationEnabled = registrationEnabled;
        }

        public Task<bool> IsMaintenanceModeEnabledAsync(CancellationToken cancellationToken = default)
            => Task.FromResult(false);

        public Task<PublicSystemStatus> GetPublicStatusAsync(CancellationToken cancellationToken = default)
            => Task.FromResult(new PublicSystemStatus { MaintenanceMode = false, RegistrationEnabled = _registrationEnabled });

        public Task<bool> IsRegistrationEnabledAsync(CancellationToken cancellationToken = default)
            => Task.FromResult(_registrationEnabled);
    }
}
