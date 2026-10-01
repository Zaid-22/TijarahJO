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
    public async Task ConfirmResetAsync_ConsumesCodeExactlyOnce_WhenRequestsRace()
    {
        var user = CreateUser("consume-once@example.com");
        var users = new FakeUserDataAccess(user);
        var sender = new CapturingPasswordResetEmailSender();
        var challenges = new FakeVerificationChallengeDataAccess();
        var service = BuildService(users, sender, new PasswordResetOptions
        {
            Enabled = true,
            CodeLength = 6,
            CodeLifetimeMinutes = 15,
            MaxAttempts = 3,
            RequestCooldownSeconds = 0
        }, challenges);

        Assert.True(await service.RequestResetAsync(user.Email));
        challenges.SynchronizeNextReads(2);

        PasswordResetConfirmationResult[] results = await Task.WhenAll(
            service.ConfirmResetAsync(user.Email, sender.LastCode, "FirstPassword1!"),
            service.ConfirmResetAsync(user.Email, sender.LastCode, "SecondPassword1!"));

        Assert.Single(results, result => result.Success);
        PasswordResetConfirmationResult rejected = Assert.Single(results, result => !result.Success);
        Assert.Equal(
            PasswordResetConfirmationFailureReason.InvalidOrExpiredCode,
            rejected.FailureReason);
        Assert.Equal(1, users.UpdateCalls);
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
        PasswordResetOptions options,
        IVerificationChallengeDataAccess? challenges = null)
    {
        return new PasswordResetService(
            users,
            challenges ?? new FakeVerificationChallengeDataAccess(),
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
        public int UpdateCalls { get; private set; }
        public bool UpdateCalled => UpdateCalls > 0;

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

        public Task<bool> UpdateUserFieldsAsync(
            UserModel user,
            int actorUserId,
            UserUpdateFields fields,
            CancellationToken cancellationToken = default)
        {
            lock (this)
            {
                UpdateCalls++;
                StoredUser = user;
            }
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
        private readonly object _gate = new();
        private readonly Dictionary<(int, string), Challenge> _challenges = [];
        private int _readsToSynchronize;
        private int _synchronizedReads;
        private TaskCompletionSource<bool>? _readBarrier;

        public void SynchronizeNextReads(int count)
        {
            lock (_gate)
            {
                _readsToSynchronize = count;
                _synchronizedReads = 0;
                _readBarrier = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
            }
        }

        public async Task<string?> GetChallengeStateAsync(int userId, string challengeType, CancellationToken cancellationToken = default)
        {
            string? result;
            Task? waitForPeers = null;
            lock (_gate)
            {
                result = _challenges.TryGetValue((userId, challengeType), out Challenge? challenge) &&
                         challenge.ExpiresAt > DateTime.UtcNow
                    ? challenge.StateJson
                    : null;

                if (_readBarrier is not null && _readsToSynchronize > 0)
                {
                    _synchronizedReads++;
                    waitForPeers = _readBarrier.Task;
                    if (_synchronizedReads >= _readsToSynchronize)
                    {
                        _readBarrier.TrySetResult(true);
                        _readBarrier = null;
                    }
                }
            }

            if (waitForPeers is not null)
            {
                await waitForPeers.WaitAsync(cancellationToken);
            }

            return result;
        }

        public Task UpsertChallengeStateAsync(int userId, string challengeType, string stateJson, DateTime expiresAt, CancellationToken cancellationToken = default)
        {
            lock (_gate)
            {
                _challenges[(userId, challengeType)] = new Challenge(stateJson, expiresAt);
            }
            return Task.CompletedTask;
        }

        public Task DeleteChallengeStateAsync(int userId, string challengeType, CancellationToken cancellationToken = default)
        {
            lock (_gate)
            {
                _challenges.Remove((userId, challengeType));
            }
            return Task.CompletedTask;
        }

        public Task<bool> TryReplaceChallengeStateAsync(
            int userId,
            string challengeType,
            string? expectedStateJson,
            string stateJson,
            DateTime expiresAt,
            CancellationToken cancellationToken = default)
        {
            lock (_gate)
            {
                bool exists = _challenges.TryGetValue((userId, challengeType), out Challenge? current);
                bool matches = expectedStateJson is null
                    ? !exists
                    : exists && string.Equals(current!.StateJson, expectedStateJson, StringComparison.Ordinal);
                if (!matches)
                {
                    return Task.FromResult(false);
                }

                _challenges[(userId, challengeType)] = new Challenge(stateJson, expiresAt);
                return Task.FromResult(true);
            }
        }

        public Task<bool> TryDeleteChallengeStateAsync(
            int userId,
            string challengeType,
            string expectedStateJson,
            CancellationToken cancellationToken = default)
        {
            lock (_gate)
            {
                if (!_challenges.TryGetValue((userId, challengeType), out Challenge? current) ||
                    !string.Equals(current.StateJson, expectedStateJson, StringComparison.Ordinal))
                {
                    return Task.FromResult(false);
                }

                _challenges.Remove((userId, challengeType));
                return Task.FromResult(true);
            }
        }
    }
}
