using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Services;
using TijarahJo.Application.Common;

namespace TijarahJo.Api.Tests;

/// <summary>
/// Unit tests for <see cref="UserCommandService"/>.
/// Uses in-process fakes — no database required.
/// </summary>
public sealed class UserCommandServiceTests
{
    // -------------------------------------------------------------------------
    // RegisterAsync
    // -------------------------------------------------------------------------

    [Fact]
    public async Task RegisterAsync_ReturnsInvalidRequest_WhenPasswordMissing()
    {
        var service = BuildService();

        UserCommandResult result = await service.RegisterAsync(new RegisterUserCommand
        {
            Password = null,
            Email = "user@example.com",
            FirstName = "Test"
        });

        Assert.False(result.Success);
        Assert.Equal(UserCommandFailureReason.InvalidRequest, result.FailureReason);
    }

    [Fact]
    public async Task RegisterAsync_ReturnsInvalidRequest_WhenEmailMissing()
    {
        var service = BuildService();

        UserCommandResult result = await service.RegisterAsync(new RegisterUserCommand
        {
            Password = "Test1234!",
            Email = null,
            FirstName = "Test"
        });

        Assert.False(result.Success);
        Assert.Equal(UserCommandFailureReason.InvalidRequest, result.FailureReason);
    }

    [Fact]
    public async Task RegisterAsync_ReturnsInvalidRequest_WhenFirstNameMissing()
    {
        var service = BuildService();

        UserCommandResult result = await service.RegisterAsync(new RegisterUserCommand
        {
            Password = "Test1234!",
            Email = "user@example.com",
            FirstName = ""
        });

        Assert.False(result.Success);
        Assert.Equal(UserCommandFailureReason.InvalidRequest, result.FailureReason);
    }

    [Fact]
    public async Task RegisterAsync_ReturnsInvalidRequest_WhenAreaIdWithoutCityId()
    {
        var service = BuildService();

        UserCommandResult result = await service.RegisterAsync(new RegisterUserCommand
        {
            Password = "Test1234!",
            Email = "user@example.com",
            FirstName = "Test",
            AreaId = 5,
            CityId = null
        });

        Assert.False(result.Success);
        Assert.Equal(UserCommandFailureReason.InvalidRequest, result.FailureReason);
    }

    [Fact]
    public async Task RegisterAsync_ReturnsInvalidStatus_WhenStatusInvalid()
    {
        var service = BuildService();

        UserCommandResult result = await service.RegisterAsync(new RegisterUserCommand
        {
            Password = "Test1234!",
            Email = "user@example.com",
            FirstName = "Test",
            Status = 99
        });

        Assert.False(result.Success);
        Assert.Equal(UserCommandFailureReason.InvalidStatus, result.FailureReason);
    }

    [Fact]
    public async Task RegisterAsync_ReturnsInvalidRequest_WhenAvatarIsNotHttp()
    {
        var service = BuildService();

        UserCommandResult result = await service.RegisterAsync(new RegisterUserCommand
        {
            Password = "Test1234!",
            Email = "user@example.com",
            FirstName = "Test",
            Avatar = "javascript:alert(1)"
        });

        Assert.False(result.Success);
        Assert.Equal(UserCommandFailureReason.InvalidRequest, result.FailureReason);
    }

    [Fact]
    public async Task RegisterAsync_ReturnsSuccess_WithValidData()
    {
        var service = BuildService();

        UserCommandResult result = await service.RegisterAsync(new RegisterUserCommand
        {
            Password = "Test1234!",
            Email = "newuser@example.com",
            FirstName = "Test"
        });

        Assert.True(result.Success);
        Assert.NotNull(result.User);
    }

    // -------------------------------------------------------------------------
    // UpdateAsync
    // -------------------------------------------------------------------------

    [Fact]
    public async Task UpdateAsync_ReturnsInvalidRequest_WhenActorIdInvalid()
    {
        var service = BuildService();

        UserCommandResult result = await service.UpdateAsync(new UpdateUserCommand
        {
            ActorUserId = 0,
            TargetUserId = 1
        });

        Assert.False(result.Success);
        Assert.Equal(UserCommandFailureReason.InvalidRequest, result.FailureReason);
    }

    [Fact]
    public async Task UpdateAsync_ReturnsForbidden_WhenNonOwnerNonAdmin()
    {
        var service = BuildService();

        UserCommandResult result = await service.UpdateAsync(new UpdateUserCommand
        {
            ActorUserId = 2,
            ActorIsAdmin = false,
            TargetUserId = 1,
            FirstName = "Hacked"
        });

        Assert.False(result.Success);
        Assert.Equal(UserCommandFailureReason.Forbidden, result.FailureReason);
    }

    [Fact]
    public async Task UpdateAsync_ReturnsNotFound_WhenUserDoesNotExist()
    {
        var service = BuildService(findUserReturnsNull: true);

        UserCommandResult result = await service.UpdateAsync(new UpdateUserCommand
        {
            ActorUserId = 1,
            TargetUserId = 1,
            FirstName = "Updated"
        });

        Assert.False(result.Success);
        Assert.Equal(UserCommandFailureReason.NotFound, result.FailureReason);
    }

    [Fact]
    public async Task UpdateAsync_ReturnsInvalidRequest_WhenAreaIdWithoutCityId()
    {
        var service = BuildService();

        UserCommandResult result = await service.UpdateAsync(new UpdateUserCommand
        {
            ActorUserId = 1,
            TargetUserId = 1,
            AreaId = 5,
            CityId = 0 // Zero clears city — area without city is invalid
        });

        Assert.False(result.Success);
        Assert.Equal(UserCommandFailureReason.InvalidRequest, result.FailureReason);
    }

    [Fact]
    public async Task UpdateAsync_ReturnsInvalidRequest_WhenAvatarIsInvalid()
    {
        var service = BuildService();

        UserCommandResult result = await service.UpdateAsync(new UpdateUserCommand
        {
            ActorUserId = 1,
            TargetUserId = 1,
            Avatar = "not-a-url"
        });

        Assert.False(result.Success);
        Assert.Equal(UserCommandFailureReason.InvalidRequest, result.FailureReason);
    }

    [Fact]
    public async Task UpdateAsync_ReturnsSuccess_SelfUpdate()
    {
        var service = BuildService();

        UserCommandResult result = await service.UpdateAsync(new UpdateUserCommand
        {
            ActorUserId = 1,
            TargetUserId = 1,
            FirstName = "Updated"
        });

        Assert.True(result.Success);
        Assert.NotNull(result.User);
        Assert.Equal("Updated", result.User!.FirstName);
    }

    [Fact]
    public async Task UpdateAsync_ProfileChangeRequestsOnlyExplicitProfileFields()
    {
        var users = new FakeUserDataAccess(new UserModel(
            userid: 1,
            hashedpassword: PasswordHelper.HashPassword("Test1234!"),
            email: "user@example.com",
            firstname: "Test",
            lastname: "User",
            phone: null,
            cityId: null,
            areaId: null,
            bio: null,
            avatar: null,
            joindate: DateTime.UtcNow,
            status: UserStatusPolicy.Active,
            roleid: 1,
            isdeleted: false,
            twoFactorEnabled: true,
            twoFactorSecret: "existing-secret",
            suspendedUntil: DateTime.UtcNow.AddHours(1)));
        var service = new UserCommandService(
            users,
            new FakeRoleService(),
            new FakeLocationReadService(),
            Microsoft.Extensions.Logging.Abstractions.NullLogger<UserCommandService>.Instance);

        UserCommandResult result = await service.UpdateAsync(new UpdateUserCommand
        {
            ActorUserId = 1,
            TargetUserId = 1,
            FirstName = "Updated",
            Avatar = "/uploads/user-avatars/new.webp"
        });

        Assert.True(result.Success);
        Assert.Equal(
            UserUpdateFields.FirstName | UserUpdateFields.Avatar,
            users.LastUpdateFields);
    }

    [Fact]
    public async Task UpdateAsync_EmailChangeRequiresReverification()
    {
        var users = new FakeUserDataAccess(new UserModel(
            userid: 1,
            hashedpassword: PasswordHelper.HashPassword("Test1234!"),
            email: "old@example.com",
            firstname: "Test",
            lastname: "User",
            phone: null,
            cityId: null,
            areaId: null,
            bio: null,
            avatar: null,
            joindate: DateTime.UtcNow,
            status: UserStatusPolicy.Active,
            roleid: 1,
            isdeleted: false,
            isEmailVerified: true));
        var service = new UserCommandService(
            users,
            new FakeRoleService(),
            new FakeLocationReadService(),
            Microsoft.Extensions.Logging.Abstractions.NullLogger<UserCommandService>.Instance);

        UserCommandResult result = await service.UpdateAsync(new UpdateUserCommand
        {
            ActorUserId = 1,
            TargetUserId = 1,
            Email = "  NEW@example.com  "
        });

        Assert.True(result.Success);
        Assert.NotNull(users.LastUpdatedUser);
        Assert.Equal("new@example.com", users.LastUpdatedUser!.Email);
        Assert.False(users.LastUpdatedUser.IsEmailVerified);
        Assert.Equal(
            UserUpdateFields.Email | UserUpdateFields.IsEmailVerified,
            users.LastUpdateFields);
    }

    [Fact]
    public async Task UpdateAsync_SameEmailIsSuccessfulNoOp()
    {
        var users = new FakeUserDataAccess(new UserModel(
            userid: 1,
            hashedpassword: PasswordHelper.HashPassword("Test1234!"),
            email: "user@example.com",
            firstname: "Test",
            lastname: "User",
            phone: null,
            cityId: null,
            areaId: null,
            bio: null,
            avatar: null,
            joindate: DateTime.UtcNow,
            status: UserStatusPolicy.Active,
            roleid: 1,
            isdeleted: false,
            isEmailVerified: true));
        var service = new UserCommandService(
            users,
            new FakeRoleService(),
            new FakeLocationReadService(),
            Microsoft.Extensions.Logging.Abstractions.NullLogger<UserCommandService>.Instance);

        UserCommandResult result = await service.UpdateAsync(new UpdateUserCommand
        {
            ActorUserId = 1,
            TargetUserId = 1,
            Email = "  USER@example.com  "
        });

        Assert.True(result.Success);
        Assert.True(result.User!.IsEmailVerified);
        Assert.Null(users.LastUpdatedUser);
        Assert.Null(users.LastUpdateFields);
    }

    [Fact]
    public async Task UpdateAsync_UnchangedProfileFieldsAreSuccessfulNoOp()
    {
        var users = new FakeUserDataAccess(new UserModel(
            userid: 1,
            hashedpassword: PasswordHelper.HashPassword("Test1234!"),
            email: "user@example.com",
            firstname: "Test",
            lastname: "User",
            phone: "+962790000000",
            cityId: null,
            areaId: null,
            bio: "Bio",
            avatar: "https://example.com/avatar.webp",
            joindate: DateTime.UtcNow,
            status: UserStatusPolicy.Active,
            roleid: 1,
            isdeleted: false));
        var service = new UserCommandService(
            users,
            new FakeRoleService(),
            new FakeLocationReadService(),
            Microsoft.Extensions.Logging.Abstractions.NullLogger<UserCommandService>.Instance);

        UserCommandResult result = await service.UpdateAsync(new UpdateUserCommand
        {
            ActorUserId = 1,
            TargetUserId = 1,
            FirstName = " Test ",
            LastName = "User",
            Phone = "0790000000",
            Bio = " Bio ",
            Avatar = "https://example.com/avatar.webp"
        });

        Assert.True(result.Success);
        Assert.Null(users.LastUpdatedUser);
        Assert.Null(users.LastUpdateFields);
    }

    [Fact]
    public async Task UpdateAsync_RejectsEmailOwnedByAnotherUser()
    {
        var users = new FakeUserDataAccess(new UserModel(
            userid: 1,
            hashedpassword: PasswordHelper.HashPassword("Test1234!"),
            email: "old@example.com",
            firstname: "Test",
            lastname: "User",
            phone: null,
            cityId: null,
            areaId: null,
            bio: null,
            avatar: null,
            joindate: DateTime.UtcNow,
            status: UserStatusPolicy.Active,
            roleid: 1,
            isdeleted: false,
            isEmailVerified: true))
        {
            ConflictingLoginUser = new UserModel(
                userid: 2,
                hashedpassword: "unused",
                email: "taken@example.com",
                firstname: "Other",
                lastname: "User",
                phone: null,
                cityId: null,
                areaId: null,
                bio: null,
                avatar: null,
                joindate: DateTime.UtcNow,
                status: UserStatusPolicy.Active,
                roleid: 1,
                isdeleted: false,
                isEmailVerified: true)
        };
        var service = new UserCommandService(
            users,
            new FakeRoleService(),
            new FakeLocationReadService(),
            Microsoft.Extensions.Logging.Abstractions.NullLogger<UserCommandService>.Instance);

        UserCommandResult result = await service.UpdateAsync(new UpdateUserCommand
        {
            ActorUserId = 1,
            TargetUserId = 1,
            Email = "taken@example.com"
        });

        Assert.False(result.Success);
        Assert.Equal(UserCommandFailureReason.InvalidRequest, result.FailureReason);
        Assert.Null(users.LastUpdatedUser);
    }

    [Fact]
    public async Task UpdateAsync_ReturnsSuccess_AdminCanUpdateOther()
    {
        var service = BuildService();

        UserCommandResult result = await service.UpdateAsync(new UpdateUserCommand
        {
            ActorUserId = 99,
            ActorIsAdmin = true,
            TargetUserId = 1,
            FirstName = "AdminUpdated"
        });

        Assert.True(result.Success);
        Assert.NotNull(result.User);
        Assert.Equal("AdminUpdated", result.User!.FirstName);
    }

    // -------------------------------------------------------------------------
    // DeleteAsync
    // -------------------------------------------------------------------------

    [Fact]
    public async Task DeleteAsync_ReturnsForbidden_WhenNonOwnerNonAdmin()
    {
        var service = BuildService();

        UserCommandResult result = await service.DeleteAsync(new DeleteUserCommand
        {
            ActorUserId = 2,
            ActorIsAdmin = false,
            TargetUserId = 1
        });

        Assert.False(result.Success);
        Assert.Equal(UserCommandFailureReason.Forbidden, result.FailureReason);
    }

    [Fact]
    public async Task DeleteAsync_ReturnsNotFound_WhenUserDoesNotExist()
    {
        var service = BuildService(findUserReturnsNull: true);

        UserCommandResult result = await service.DeleteAsync(new DeleteUserCommand
        {
            ActorUserId = 1,
            TargetUserId = 1
        });

        Assert.False(result.Success);
        Assert.Equal(UserCommandFailureReason.NotFound, result.FailureReason);
    }

    [Fact]
    public async Task DeleteAsync_ReturnsSuccess()
    {
        var service = BuildService();

        UserCommandResult result = await service.DeleteAsync(new DeleteUserCommand
        {
            ActorUserId = 1,
            TargetUserId = 1
        });

        Assert.True(result.Success);
        Assert.NotNull(result.User);
    }

    [Fact]
    public async Task UpdateAsync_ClearsSuspendedUntil_WhenClearSuspensionRequested()
    {
        DateTime suspendedUntil = DateTime.UtcNow.AddHours(24);
        var suspendedUser = new UserModel(
            userid: 1,
            hashedpassword: TijarahJo.Application.Common.PasswordHelper.HashPassword("Test1234!"),
            email: "user@example.com",
            firstname: "Test",
            lastname: "User",
            phone: null,
            cityId: null,
            areaId: null,
            bio: null,
            avatar: null,
            joindate: DateTime.UtcNow,
            status: 1,
            roleid: 1,
            isdeleted: false,
            suspendedUntil: suspendedUntil
        );

        var users = new FakeUserDataAccess(suspendedUser);
        var service = new UserCommandService(
            users,
            new FakeRoleService(),
            new FakeLocationReadService(),
            Microsoft.Extensions.Logging.Abstractions.NullLogger<UserCommandService>.Instance);

        UserCommandResult result = await service.UpdateAsync(new UpdateUserCommand
        {
            ActorUserId = 2,
            ActorIsAdmin = true,
            TargetUserId = 1,
            Status = 1,
            ClearSuspension = true
        });

        Assert.True(result.Success);
        Assert.NotNull(result.User);
        Assert.Null(result.User!.SuspendedUntil);
        Assert.NotNull(users.LastUpdatedUser);
        Assert.Null(users.LastUpdatedUser!.SuspendedUntil);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private static UserCommandService BuildService(bool findUserReturnsNull = false)
    {
        var model = new UserModel(
            userid: 1,
            hashedpassword: TijarahJo.Application.Common.PasswordHelper.HashPassword("Test1234!"),
            email: "user@example.com",
            firstname: "Test",
            lastname: "User",
            phone: null,
            cityId: null,
            areaId: null,
            bio: null,
            avatar: null,
            joindate: DateTime.UtcNow,
            status: 1,
            roleid: 1,
            isdeleted: false
        );

        var users = new FakeUserDataAccess(findUserReturnsNull ? null : model);
        var roles = new FakeRoleService();
        var locations = new FakeLocationReadService();
        var logger = Microsoft.Extensions.Logging.Abstractions.NullLogger<UserCommandService>.Instance;

        return new UserCommandService(users, roles, locations, logger);
    }

    // -------------------------------------------------------------------------
    // Fakes
    // -------------------------------------------------------------------------

    private sealed class FakeUserDataAccess : IUserDataAccess
    {
        private readonly UserModel? _account;

        public UserModel? LastUpdatedUser { get; private set; }
        public UserUpdateFields? LastUpdateFields { get; private set; }
        public UserModel? ConflictingLoginUser { get; set; }

        public FakeUserDataAccess(UserModel? account) => _account = account;

        public Task<UserModel?> GetUserByIDAsync(int? userId, CancellationToken ct = default)
            => Task.FromResult(_account);

        public Task<UserModel?> GetUserByLoginAsync(string login, CancellationToken ct = default)
        {
            if (ConflictingLoginUser != null &&
                string.Equals(login, ConflictingLoginUser.Email, StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult<UserModel?>(ConflictingLoginUser);
            }

            return Task.FromResult(MatchesLogin(login) ? _account : null);
        }

        public Task<UserModel?> GetUserByLoginCandidatesAsync(IReadOnlyList<string> candidates, CancellationToken ct = default)
            => Task.FromResult(candidates.Any(MatchesLogin) ? _account : null);

        public Task<int> AddUserAsync(UserModel user, CancellationToken ct = default)
            => Task.FromResult(1);

        public Task<bool> UpdateUserFieldsAsync(
            UserModel user,
            int actorUserId,
            UserUpdateFields fields,
            CancellationToken cancellationToken = default)
        {
            LastUpdateFields = fields;
            LastUpdatedUser = user;
            return Task.FromResult(true);
        }

        public Task<bool> DeleteUserAsync(int? userId, int actorUserId, CancellationToken ct = default)
            => Task.FromResult(true);

        public Task<bool> DoesUserExistAsync(int? userId, CancellationToken ct = default)
            => Task.FromResult(true);

        public Task<IReadOnlyList<UserModel>> GetAllUsersAsync(int page = 1, int size = 50, CancellationToken ct = default)
            => Task.FromResult<IReadOnlyList<UserModel>>(Array.Empty<UserModel>());

        private bool MatchesLogin(string login)
        {
            if (_account == null || string.IsNullOrWhiteSpace(login))
            {
                return false;
            }

            string trimmedLogin = login.Trim();
            if (trimmedLogin.Contains('@'))
            {
                return string.Equals(_account.Email, trimmedLogin, StringComparison.OrdinalIgnoreCase);
            }

            string? normalizedPhone = PhoneNumberNormalizer.NormalizeJordanPhone(trimmedLogin);
            return !string.IsNullOrWhiteSpace(normalizedPhone) &&
                   string.Equals(_account.Phone, normalizedPhone, StringComparison.Ordinal);
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
        public Task<IReadOnlyList<CityLookupResult>> GetCitiesAsync(CancellationToken ct = default)
            => Task.FromResult<IReadOnlyList<CityLookupResult>>(new[]
            {
                new CityLookupResult { CityId = 1, CityName = "Amman" },
                new CityLookupResult { CityId = 2, CityName = "Irbid" }
            });

        public Task<IReadOnlyList<AreaLookupResult>> GetAreasByCityAsync(int cityId, CancellationToken ct = default)
            => Task.FromResult<IReadOnlyList<AreaLookupResult>>(new[]
            {
                new AreaLookupResult { AreaId = 10, AreaName = "Downtown", CityId = cityId }
            });
    }
}
