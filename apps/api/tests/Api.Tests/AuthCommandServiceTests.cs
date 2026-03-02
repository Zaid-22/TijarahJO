using TijarahJo.Domain.Models;
using TijarahJoDB.Application.Abstractions.DataAccess;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.Application.Services;
using TijarahJoDB.BLL;

namespace TijarahJoDBAPI.Tests;

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
        var hashedCorrectPassword = TijarahJoDB.Application.Common.PasswordHelper.HashPassword("correct-password");
        var service = BuildService(hashedPassword: hashedCorrectPassword);

        AuthCommandResult result = await service.LoginAsync(new LoginCommand
        {
            Login = "user@example.com",
            Password = "wrong-password"
        });

        Assert.False(result.Success);
        Assert.Equal(AuthCommandFailureReason.InvalidCredentials, result.FailureReason);
    }

    [Fact]
    public async Task LoginAsync_ReturnsInvalidCredentials_WhenUserIsSoftDeleted()
    {
        var hash = TijarahJoDB.Application.Common.PasswordHelper.HashPassword("pass");
        var service = BuildService(hashedPassword: hash, isDeleted: true);

        AuthCommandResult result = await service.LoginAsync(new LoginCommand
        {
            Login = "user@example.com",
            Password = "pass"
        });

        Assert.False(result.Success);
        Assert.Equal(AuthCommandFailureReason.InvalidCredentials, result.FailureReason);
    }

    [Fact]
    public async Task LoginAsync_ReturnsUserInactive_WhenUserIsBanned()
    {
        var hash = TijarahJoDB.Application.Common.PasswordHelper.HashPassword("pass");
        // Status = 2 means banned/inactive (Active = 1 per UserStatusPolicy)
        var service = BuildService(hashedPassword: hash, status: 2);

        AuthCommandResult result = await service.LoginAsync(new LoginCommand
        {
            Login = "user@example.com",
            Password = "pass"
        });

        Assert.False(result.Success);
        Assert.Equal(AuthCommandFailureReason.UserInactive, result.FailureReason);
    }

    [Fact]
    public async Task LoginAsync_ReturnsSuccess_WhenCredentialsAreValid()
    {
        var hash = TijarahJoDB.Application.Common.PasswordHelper.HashPassword("correct-pass");
        var service = BuildService(hashedPassword: hash);

        AuthCommandResult result = await service.LoginAsync(new LoginCommand
        {
            Login = "user@example.com",
            Password = "correct-pass"
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
            Password = "pass",
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
            Password = "pass",
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
            Password = "pass",
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
            Password = "pass",
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
            Password = "pass",
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
            Password = "pass",
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
            Password = "pass",
            FirstName = "Test",
            Email = "newuser@example.com"
        });

        Assert.True(result.Success);
        Assert.NotNull(result.User);
        Assert.Equal("User", result.RoleName);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private static AuthCommandService BuildService(
        UserModel? nextFindUser = null,
        string? hashedPassword = null,
        bool isDeleted = false,
        int status = 1 /* Active */)
    {
        var model = new UserModel(
            userid: 1,
            hashedpassword: hashedPassword ?? TijarahJoDB.Application.Common.PasswordHelper.HashPassword("default"),
            email: "user@example.com",
            firstname: "Test",
            lastname: "User",
            phone: null,
            cityId: null,
            areaId: null,
            bio: null,
            avatar: null,
            joindate: DateTime.UtcNow,
            status: status,
            roleid: 1,
            isdeleted: isDeleted
        );

        var account = nextFindUser ?? model;

        var users = new FakeUserDataAccess(account);
        var externalIdentities = new FakeExternalIdentityDataAccess();
        var roles = new FakeRoleService();
        var locations = new FakeLocationReadService();
        var logger = Microsoft.Extensions.Logging.Abstractions.NullLogger<AuthCommandService>.Instance;

        return new AuthCommandService(users, externalIdentities, roles, locations, logger);
    }

    // -------------------------------------------------------------------------
    // Fakes
    // -------------------------------------------------------------------------

    private sealed class FakeUserDataAccess : IUserDataAccess
    {
        private readonly UserModel _account;
        private bool _saveResult = true;

        public FakeUserDataAccess(UserModel account) => _account = account;

        public Task<UserModel?> GetUserByIDAsync(int? userId, CancellationToken ct = default)
            => Task.FromResult<UserModel?>(_account);

        public Task<UserModel?> GetUserByLoginAsync(string login, CancellationToken ct = default)
            => Task.FromResult<UserModel?>(
                _account.IsDeleted
                    ? null
                    : _account);

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
            => Task.FromResult(_saveResult);

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
}
