using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TijarahJo.Domain.Models;
using TijarahJoDB.Application.Abstractions.DataAccess;
using TijarahJoDB.Application.Common;
using TijarahJo.Api.Common.Configuration;
using TijarahJo.Api.Common.Services;

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

    private static PasswordResetService BuildService(
        IUserDataAccess users,
        IPasswordResetEmailSender sender,
        PasswordResetOptions options)
    {
        return new PasswordResetService(
            users,
            sender,
            Options.Create(options),
            NullLogger<PasswordResetService>.Instance
        );
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
    }

    private sealed class FakeUserDataAccess : IUserDataAccess
    {
        public FakeUserDataAccess(UserModel storedUser)
        {
            StoredUser = storedUser;
        }

        public UserModel StoredUser { get; private set; }
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
            => Task.FromResult<IReadOnlyList<UserModel>>(Array.Empty<UserModel>());

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
}
