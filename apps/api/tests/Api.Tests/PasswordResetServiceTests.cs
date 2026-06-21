using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Common;
using TijarahJo.Api.Common.Configuration;
using TijarahJo.Api.Common.Services;
using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Api.Tests;

public sealed class PasswordResetServiceTests
{
    [Fact]
    public async Task ConfirmResetAsync_UpdatesPassword_WhenVerificationCodeIsValid()
    {
        var user = CreateUser("user@example.com");
        var users = new FakeUserDataAccess(user);
        var sender = new CapturingPasswordResetEmailSender();
        var service = BuildService(users, sender, new PasswordResetOptions
        {
            Enabled = true,
            CodeLength = 6,
            CodeLifetimeMinutes = 15,
            MaxAttempts = 3,
            RequestCooldownSeconds = 0
        });

        await service.RequestResetAsync(user.Email);
        Assert.False(string.IsNullOrWhiteSpace(sender.LastCode));

        PasswordResetConfirmationResult result = await service.ConfirmResetAsync(
            user.Email,
            sender.LastCode,
            "NewPassword1!"
        );

        Assert.True(result.Success);
        Assert.True(users.UpdateCalled);
        Assert.True(PasswordHelper.VerifyPassword("NewPassword1!", users.StoredUser.HashedPassword));
    }

    [Fact]
    public async Task VerifyCodeAsync_RejectsInvalidVerificationCode()
    {
        var user = CreateUser("verify-invalid@example.com");
        var users = new FakeUserDataAccess(user);
        var sender = new CapturingPasswordResetEmailSender();
        var service = BuildService(users, sender, new PasswordResetOptions
        {
            Enabled = true,
            CodeLength = 6,
            CodeLifetimeMinutes = 15,
            MaxAttempts = 3,
            RequestCooldownSeconds = 0
        });

        await service.RequestResetAsync(user.Email);

        PasswordResetConfirmationResult result = await service.VerifyCodeAsync(
            user.Email,
            sender.LastCode == "000000" ? "111111" : "000000"
        );

        Assert.False(result.Success);
        Assert.Equal(
            PasswordResetConfirmationFailureReason.InvalidOrExpiredCode,
            result.FailureReason
        );
        Assert.False(users.UpdateCalled);
    }

    [Fact]
    public async Task VerifyCodeAsync_DoesNotConsumeValidVerificationCode()
    {
        var user = CreateUser("verify-valid@example.com");
        var users = new FakeUserDataAccess(user);
        var sender = new CapturingPasswordResetEmailSender();
        var service = BuildService(users, sender, new PasswordResetOptions
        {
            Enabled = true,
            CodeLength = 6,
            CodeLifetimeMinutes = 15,
            MaxAttempts = 3,
            RequestCooldownSeconds = 0
        });

        await service.RequestResetAsync(user.Email);
        Assert.False(string.IsNullOrWhiteSpace(sender.LastCode));

        PasswordResetConfirmationResult verifyResult = await service.VerifyCodeAsync(
            user.Email,
            sender.LastCode
        );

        Assert.True(verifyResult.Success);
        Assert.False(users.UpdateCalled);

        PasswordResetConfirmationResult confirmResult = await service.ConfirmResetAsync(
            user.Email,
            sender.LastCode,
            "NewPassword1!"
        );

        Assert.True(confirmResult.Success);
        Assert.True(users.UpdateCalled);
    }

    [Fact]
    public async Task ConfirmResetAsync_ReturnsTooManyAttempts_AfterRepeatedInvalidCodes()
    {
        var user = CreateUser("user2@example.com");
        var users = new FakeUserDataAccess(user);
        var sender = new CapturingPasswordResetEmailSender();
        var service = BuildService(users, sender, new PasswordResetOptions
        {
            Enabled = true,
            CodeLength = 6,
            CodeLifetimeMinutes = 15,
            MaxAttempts = 2,
            RequestCooldownSeconds = 0
        });

        await service.RequestResetAsync(user.Email);
        Assert.False(string.IsNullOrWhiteSpace(sender.LastCode));

        PasswordResetConfirmationResult firstAttempt = await service.ConfirmResetAsync(
            user.Email,
            "999999",
            "NewPassword1!"
        );
        Assert.False(firstAttempt.Success);
        Assert.Equal(
            PasswordResetConfirmationFailureReason.InvalidOrExpiredCode,
            firstAttempt.FailureReason
        );

        PasswordResetConfirmationResult secondAttempt = await service.ConfirmResetAsync(
            user.Email,
            "999999",
            "NewPassword1!"
        );
        Assert.False(secondAttempt.Success);
        Assert.Equal(
            PasswordResetConfirmationFailureReason.TooManyAttempts,
            secondAttempt.FailureReason
        );
    }

    [Fact]
    public async Task RequestResetAsync_ReturnsFalse_WhenEmailTransportNotConfigured()
    {
        var user = CreateUser("transport-off@example.com");
        var users = new FakeUserDataAccess(user);
        var sender = new DisabledTransportEmailSender();
        var service = BuildService(users, sender, new PasswordResetOptions
        {
            Enabled = true,
            CodeLength = 6,
            CodeLifetimeMinutes = 15,
            MaxAttempts = 3,
            RequestCooldownSeconds = 0
        });

        bool result = await service.RequestResetAsync(user.Email);

        Assert.False(result);
    }

    private static PasswordResetService BuildService(
        IUserDataAccess users,
        IPasswordResetEmailSender sender,
        PasswordResetOptions options)
    {
        return new PasswordResetService(
            users,
            new FakeVerificationChallengeDataAccess(),
            sender,
            Options.Create(options),
            NullLogger<PasswordResetService>.Instance,
            new FakeTokenBlacklistService(),
            new JwtOptions { SigningKey = "UnitTestSigningKey_AtLeast32Chars_Long" }
        );
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

    private static UserModel CreateUser(string email)
    {
        return new UserModel(
            userid: 42,
            hashedpassword: PasswordHelper.HashPassword("Start123!"),
            email: email,
            firstname: "Reset",
            lastname: "Tester",
            phone: null,
            cityId: null,
            areaId: null,
            bio: null,
            avatar: null,
            joindate: DateTime.UtcNow,
            status: UserStatusPolicy.Active,
            roleid: 1,
            isdeleted: false
        );
    }

    private sealed class CapturingPasswordResetEmailSender : IPasswordResetEmailSender
    {
        public string LastCode { get; private set; } = string.Empty;

        public Task SendPasswordResetCodeAsync(
            string recipientEmail,
            string? recipientFirstName,
            string code,
            TimeSpan ttl,
            CancellationToken cancellationToken = default)
        {
            LastCode = code;
            return Task.CompletedTask;
        }

        // Mock always reports the transport as ready so existing tests are unaffected.
        public bool IsTransportConfigured() => true;
    }

    private sealed class DisabledTransportEmailSender : IPasswordResetEmailSender
    {
        public Task SendPasswordResetCodeAsync(
            string recipientEmail,
            string? recipientFirstName,
            string code,
            TimeSpan ttl,
            CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        // Simulates email transport not being configured (no API key, disabled, etc.)
        public bool IsTransportConfigured() => false;
    }

    private sealed class FakeUserDataAccess(UserModel storedUser) : IUserDataAccess
    {
        public UserModel StoredUser { get; private set; } = storedUser;
        public bool UpdateCalled { get; private set; }

        public Task<UserModel?> GetUserByIDAsync(int? userId, CancellationToken cancellationToken = default)
        {
            if (!userId.HasValue || StoredUser.UserID != userId.Value)
            {
                return Task.FromResult<UserModel?>(null);
            }

            return Task.FromResult<UserModel?>(StoredUser);
        }

        public Task<int> AddUserAsync(UserModel user, CancellationToken cancellationToken = default)
            => Task.FromResult(1);

        public Task<bool> UpdateUserAsync(UserModel user, int actorUserId, CancellationToken cancellationToken = default)
        {
            UpdateCalled = true;
            StoredUser = user;
            return Task.FromResult(true);
        }

        public Task<bool> DeleteUserAsync(int? userId, int actorUserId, CancellationToken cancellationToken = default)
            => Task.FromResult(true);

        public Task<bool> DoesUserExistAsync(int? userId, CancellationToken cancellationToken = default)
            => Task.FromResult(true);

        public Task<IReadOnlyList<UserModel>> GetAllUsersAsync(
            int pageNumber = 1,
            int pageSize = 50,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<UserModel>>([]);

        public Task<UserModel?> GetUserByLoginAsync(string login, CancellationToken cancellationToken = default)
        {
            bool matches = string.Equals(login, StoredUser.Email, StringComparison.OrdinalIgnoreCase);
            return Task.FromResult(matches ? StoredUser : null);
        }

        public async Task<UserModel?> GetUserByLoginCandidatesAsync(IReadOnlyList<string> candidates, CancellationToken cancellationToken = default)
        {
            foreach (var c in candidates)
            {
                var u = await GetUserByLoginAsync(c, cancellationToken);
                if (u != null) return u;
            }
            return null;
        }
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
