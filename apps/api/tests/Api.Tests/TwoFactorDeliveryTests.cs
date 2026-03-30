using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TijarahJo.Api.Common.Configuration;
using TijarahJo.Api.Common.Services;
using TijarahJo.Api.Contracts.Requests;
using TijarahJo.Api.Contracts.Responses;
using TijarahJo.Api.Features.Auth;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Common;
using TijarahJo.Domain.Models;

namespace TijarahJo.Api.Tests;

public sealed class TwoFactorDeliveryTests
{
    [Fact]
    public async Task Login_ReturnsServiceUnavailable_WhenTwoFactorEmailFails()
    {
        var user = CreateUser(twoFactorEnabled: true, twoFactorSecret: "EMAIL");
        var authCommands = new FakeAuthCommandService(new AuthCommandResult
        {
            Success = true,
            User = user,
            RoleName = "User"
        });
        var controller = new AuthController(
            new FakeTokenService(),
            authCommands,
            new FakeUserQueryHandler(),
            new FakeRoleService(),
            new FakeUserPermissionService(),
            CreateTwoFactorService(),
            new FakeEmailTwoFactorSender(new EmailTwoFactorSendResult(false, "SMTP unavailable.")),
            new FakeTokenBlacklistService(),
            NullLogger<AuthController>.Instance
        )
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            }
        };

        ActionResult<AuthResponse> actionResult = await controller.Login(
            new LoginRequest { Login = user.Email, Password = "Password123!" },
            CancellationToken.None
        );

        ObjectResult? result = Assert.IsType<ObjectResult>(actionResult.Result);
        Assert.Equal(StatusCodes.Status503ServiceUnavailable, result.StatusCode);

        ProblemDetails problem = Assert.IsType<ProblemDetails>(result.Value);
        Assert.Equal("SMTP unavailable.", problem.Detail);
    }

    [Fact]
    public async Task StartTwoFactorSetup_ReturnsServiceUnavailable_AndDoesNotPersist_WhenEmailFails()
    {
        var user = CreateUser(twoFactorEnabled: false, twoFactorSecret: null);
        var users = new FakeUserDataAccess(user);
        var controller = new TwoFactorController(
            CreateTwoFactorService(),
            users,
            new FakeTokenService(),
            new FakeRoleService(),
            new FakeUserPermissionService(),
            new FakeEmailTwoFactorSender(new EmailTwoFactorSendResult(false, "Two-factor email delivery is not configured on the server.")),
            NullLogger<TwoFactorController>.Instance
        )
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = CreateAuthenticatedHttpContext(user.UserID!.Value)
            }
        };

        ActionResult<TwoFactorSetupStartResponse> actionResult = await controller.StartTwoFactorSetup(CancellationToken.None);

        ObjectResult? result = Assert.IsType<ObjectResult>(actionResult.Result);
        Assert.Equal(StatusCodes.Status503ServiceUnavailable, result.StatusCode);
        Assert.False(users.UpdateCalled);

        ProblemDetails problem = Assert.IsType<ProblemDetails>(result.Value);
        Assert.Equal("Two-factor email delivery is not configured on the server.", problem.Detail);
    }

    [Fact]
    public async Task StartTwoFactorSetup_DoesNotReturnDevelopmentCode_WhenFallbackIsUsed()
    {
        var user = CreateUser(twoFactorEnabled: false, twoFactorSecret: null);
        var users = new FakeUserDataAccess(user);
        var controller = new TwoFactorController(
            CreateTwoFactorService(),
            users,
            new FakeTokenService(),
            new FakeRoleService(),
            new FakeUserPermissionService(),
            new FakeEmailTwoFactorSender(new EmailTwoFactorSendResult(
                true,
                DebugCode: "123456",
                UsedDevelopmentFallback: true
            )),
            NullLogger<TwoFactorController>.Instance
        )
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = CreateAuthenticatedHttpContext(user.UserID!.Value)
            }
        };

        ActionResult<TwoFactorSetupStartResponse> actionResult = await controller.StartTwoFactorSetup(CancellationToken.None);

        TwoFactorSetupStartResponse response = Assert.IsType<TwoFactorSetupStartResponse>(Assert.IsType<OkObjectResult>(actionResult.Result).Value);
        Assert.DoesNotContain("Development code:", response.Message);
        Assert.Equal("A verification code has been sent to your email. Please enter it to confirm.", response.Message);
        Assert.True(users.UpdateCalled);
    }

    private static TwoFactorService CreateTwoFactorService()
    {
        return new TwoFactorService(
            Options.Create(new TwoFactorOptions
            {
                Digits = 6,
                LoginChallengeLifetimeSeconds = 300,
                SecretEncryptionKey = "UnitTestTwoFactorSecretKey_AtLeast32Chars",
                ChallengeSigningKey = "UnitTestTwoFactorChallengeKey_AtLeast32"
            }),
            new JwtOptions
            {
                SigningKey = "UnitTestSigningKey_AtLeast32Chars_Long"
            },
            new FakeVerificationChallengeDataAccess()
        );
    }

    private static DefaultHttpContext CreateAuthenticatedHttpContext(int userId)
    {
        return new DefaultHttpContext
        {
            User = new ClaimsPrincipal(
                new ClaimsIdentity(
                    [new Claim(ClaimTypes.NameIdentifier, userId.ToString())],
                    authenticationType: "Test"
                )
            )
        };
    }

    private static UserModel CreateUser(
        bool twoFactorEnabled,
        string? twoFactorSecret)
    {
        return new UserModel(
            userid: 7,
            hashedpassword: PasswordHelper.HashPassword("Password123!"),
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
            twoFactorEnabled: twoFactorEnabled,
            twoFactorSecret: twoFactorSecret
        );
    }

    private sealed class FakeEmailTwoFactorSender(EmailTwoFactorSendResult result) : IEmailTwoFactorSender
    {
        public Task<EmailTwoFactorSendResult> SendTwoFactorCodeAsync(
            string recipientEmail,
            string? recipientFirstName,
            string code,
            TimeSpan ttl,
            CancellationToken cancellationToken = default)
            => Task.FromResult(result);
    }

    private sealed class FakeAuthCommandService(AuthCommandResult loginResult) : IAuthCommandService
    {
        public Task<AuthCommandResult> LoginAsync(LoginCommand command, CancellationToken cancellationToken = default)
            => Task.FromResult(loginResult);

        public Task<AuthCommandResult> SignupAsync(SignupCommand command, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<AuthCommandResult> GoogleAuthAsync(GoogleAuthCommand command, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();
    }

    private sealed class FakeTokenService : ITokenService
    {
        public string GenerateToken(int userId, string email, string roleName) => "token";
    }

    private sealed class FakeUserQueryHandler : IUserQueryHandler
    {
        public Task<UserListQueryResult> GetAllAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<UserByIdQueryResult> GetByIdAsync(UserByIdQuery query, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<UserExistsQueryResult> ExistsAsync(int userId, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();
    }

    private sealed class FakeUserPermissionService : IUserPermissionService
    {
        public Task<UserPermissionSnapshot> GetUserPermissionSnapshotAsync(int userId, CancellationToken cancellationToken = default)
            => Task.FromResult(new UserPermissionSnapshot
            {
                RoleName = "User",
                HasAdminAccess = false,
                PermissionKeys = []
            });

        public Task<bool> HasPermissionAsync(int userId, string permissionKey, CancellationToken cancellationToken = default)
            => Task.FromResult(false);
    }

    private sealed class FakeRoleService : IRoleService
    {
        public Task<IReadOnlyList<RoleModel>> GetAllRolesAsync(CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<RoleModel>>([]);

        public Task<Role?> FindAsync(int? roleId, CancellationToken cancellationToken = default)
            => Task.FromResult<Role?>(null);

        public Role Create(RoleModel model) => throw new NotImplementedException();
        public Task<bool> SaveAsync(Role role, CancellationToken cancellationToken = default) => Task.FromResult(false);
        public Task<bool> DeleteRoleAsync(int? roleId, CancellationToken cancellationToken = default) => Task.FromResult(false);
        public Task<bool> DoesRoleExistAsync(int? roleId, CancellationToken cancellationToken = default) => Task.FromResult(false);
    }

    private sealed class FakeTokenBlacklistService : ITokenBlacklistService
    {
        public Task AddToBlacklistAsync(string jti, DateTimeOffset expiresAt, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task<bool> IsBlacklistedAsync(string jti, CancellationToken cancellationToken = default)
            => Task.FromResult(false);

        public Task InvalidateAllUserSessionsAsync(int userId, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task<bool> IsUserSessionInvalidatedAsync(int userId, DateTimeOffset tokenIssuedAt, CancellationToken cancellationToken = default)
            => Task.FromResult(false);
    }

    private sealed class FakeUserDataAccess(UserModel user) : IUserDataAccess
    {
        public UserModel StoredUser { get; private set; } = user;
        public bool UpdateCalled { get; private set; }

        public Task<UserModel?> GetUserByIDAsync(int? userId, CancellationToken cancellationToken = default)
            => Task.FromResult(userId == StoredUser.UserID ? StoredUser : null);

        public Task<int> AddUserAsync(UserModel user, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<bool> UpdateUserAsync(UserModel user, int actorUserId, CancellationToken cancellationToken = default)
        {
            UpdateCalled = true;
            StoredUser = user;
            return Task.FromResult(true);
        }

        public Task<bool> DeleteUserAsync(int? userId, int actorUserId, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<bool> DoesUserExistAsync(int? userId, CancellationToken cancellationToken = default)
            => Task.FromResult(userId == StoredUser.UserID);

        public Task<IReadOnlyList<UserModel>> GetAllUsersAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<UserModel>>([]);

        public Task<UserModel?> GetUserByLoginAsync(string login, CancellationToken cancellationToken = default)
            => Task.FromResult(string.Equals(login, StoredUser.Email, StringComparison.OrdinalIgnoreCase) ? StoredUser : null);

        public Task<UserModel?> GetUserByLoginCandidatesAsync(IReadOnlyList<string> candidates, CancellationToken cancellationToken = default)
            => Task.FromResult<UserModel?>(candidates.Any(candidate => string.Equals(candidate, StoredUser.Email, StringComparison.OrdinalIgnoreCase)) ? StoredUser : null);
    }

    private sealed class FakeVerificationChallengeDataAccess : IVerificationChallengeDataAccess
    {
        private sealed record Challenge(string StateJson, DateTime ExpiresAt);
        private readonly Dictionary<(int, string), Challenge> _challenges = [];

        public Task<string?> GetChallengeStateAsync(int userId, string challengeType, CancellationToken cancellationToken = default)
        {
             if (_challenges.TryGetValue((userId, challengeType), out var c) && c.ExpiresAt > DateTime.UtcNow)
             {
                 return Task.FromResult<string?>(c.StateJson);
             }
             return Task.FromResult<string?>(null);
        }

        public Task UpsertChallengeStateAsync(int userId, string challengeType, string stateJson, DateTime expiresAt, CancellationToken cancellationToken = default)
        {
             _challenges[(userId, challengeType)] = new Challenge(stateJson, expiresAt);
             return Task.CompletedTask;
        }

        public Task DeleteChallengeStateAsync(int userId, string challengeType, CancellationToken cancellationToken = default)
        {
             _challenges.Remove((userId, challengeType));
             return Task.CompletedTask;
        }
    }
}
