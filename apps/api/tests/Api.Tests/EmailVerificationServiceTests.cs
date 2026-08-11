using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TijarahJo.Api.Common.Configuration;
using TijarahJo.Api.Common.Services;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Common;
using TijarahJo.Domain.Models;

namespace TijarahJo.Api.Tests;

public sealed class EmailVerificationServiceTests
{
    [Fact]
    public async Task ConfirmVerification_RejectsFabricatedToken_ForAlreadyVerifiedUser()
    {
        var user = new UserModel(
            userid: 42,
            hashedpassword: "unused",
            email: "verified@example.com",
            firstname: "Verified",
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
            isEmailVerified: true);
        var challenges = new EmptyVerificationChallengeDataAccess();
        var service = new EmailVerificationService(
            new SingleUserDataAccess(user),
            challenges,
            Options.Create(new EmailVerificationOptions { Enabled = true }),
            new ConfigurationBuilder().Build(),
            NullLogger<EmailVerificationService>.Instance,
            new TestHttpClientFactory(),
            new JwtOptions { SigningKey = "UnitTestSigningKey_AtLeast32Chars_Long" });

        EmailVerificationConfirmResult result = await service.ConfirmVerificationAsync(
            "42.attacker-controlled-token");

        Assert.False(result.Success);
        Assert.Equal(EmailVerificationConfirmFailureReason.InvalidToken, result.FailureReason);
        Assert.Null(result.User);
        Assert.Equal(0, challenges.ReadCalls);
    }

    private sealed class SingleUserDataAccess(UserModel user) : IUserDataAccess
    {
        public Task<UserModel?> GetUserByIDAsync(
            int? userId,
            CancellationToken cancellationToken = default)
            => Task.FromResult(userId == user.UserID ? user : null);

        public Task<int> AddUserAsync(UserModel model, CancellationToken cancellationToken = default)
            => Task.FromResult(0);

        public Task<bool> UpdateUserAsync(
            UserModel model,
            int actorUserId,
            CancellationToken cancellationToken = default)
            => Task.FromResult(false);

        public Task<bool> DeleteUserAsync(
            int? userId,
            int actorUserId,
            CancellationToken cancellationToken = default)
            => Task.FromResult(false);

        public Task<bool> DoesUserExistAsync(int? userId, CancellationToken cancellationToken = default)
            => Task.FromResult(userId == user.UserID);

        public Task<IReadOnlyList<UserModel>> GetAllUsersAsync(
            int pageNumber = 1,
            int pageSize = 50,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<UserModel>>([user]);

        public Task<UserModel?> GetUserByLoginAsync(
            string login,
            CancellationToken cancellationToken = default)
            => Task.FromResult<UserModel?>(null);

        public Task<UserModel?> GetUserByLoginCandidatesAsync(
            IReadOnlyList<string> candidates,
            CancellationToken cancellationToken = default)
            => Task.FromResult<UserModel?>(null);
    }

    private sealed class EmptyVerificationChallengeDataAccess : IVerificationChallengeDataAccess
    {
        public int ReadCalls { get; private set; }

        public Task<string?> GetChallengeStateAsync(
            int userId,
            string challengeType,
            CancellationToken cancellationToken = default)
        {
            ReadCalls++;
            return Task.FromResult<string?>(null);
        }

        public Task UpsertChallengeStateAsync(
            int userId,
            string challengeType,
            string stateJson,
            DateTime expiresAt,
            CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task DeleteChallengeStateAsync(
            int userId,
            string challengeType,
            CancellationToken cancellationToken = default)
            => Task.CompletedTask;
    }

    private sealed class TestHttpClientFactory : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => new();
    }
}
