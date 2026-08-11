using TijarahJo.Application.Common;
using TijarahJo.Domain.Entities;
using TijarahJo.Domain.Models;
using TijarahJo.Infrastructure.DataAccess;
using TijarahJo.Infrastructure.Services;

namespace TijarahJo.Api.Tests;

public sealed class SessionInvalidationTests
{
    private static readonly DateTime UtcNow = new(2026, 8, 9, 12, 0, 0, DateTimeKind.Utc);
    private static readonly DateTimeOffset IssuedAt = new(UtcNow.AddMinutes(-5));

    [Theory]
    [InlineData(false, false, UserStatusPolicy.Active)]
    [InlineData(true, true, UserStatusPolicy.Active)]
    [InlineData(true, false, 0)]
    public void ShouldRejectUserSession_RejectsUnavailableUsers(
        bool userExists,
        bool isDeleted,
        int status)
    {
        bool rejected = DatabaseTokenBlacklistService.ShouldRejectUserSession(
            userExists,
            isDeleted,
            status,
            suspendedUntil: null,
            lastInvalidatedAt: null,
            IssuedAt,
            UtcNow);

        Assert.True(rejected);
    }

    [Fact]
    public void ShouldRejectUserSession_RejectsCurrentlySuspendedUser()
    {
        bool rejected = DatabaseTokenBlacklistService.ShouldRejectUserSession(
            userExists: true,
            isDeleted: false,
            status: UserStatusPolicy.Active,
            suspendedUntil: UtcNow.AddSeconds(1),
            lastInvalidatedAt: null,
            IssuedAt,
            UtcNow);

        Assert.True(rejected);
    }

    [Fact]
    public void ShouldRejectUserSession_AllowsExpiredSuspensionAtBoundary()
    {
        bool rejected = DatabaseTokenBlacklistService.ShouldRejectUserSession(
            userExists: true,
            isDeleted: false,
            status: UserStatusPolicy.Active,
            suspendedUntil: UtcNow,
            lastInvalidatedAt: null,
            IssuedAt,
            UtcNow);

        Assert.False(rejected);
    }

    [Theory]
    [InlineData(-1, true)]
    [InlineData(0, false)]
    [InlineData(1, false)]
    public void ShouldRejectUserSession_HonorsInvalidationBoundary(
        int issuedOffsetSeconds,
        bool expectedRejected)
    {
        bool rejected = DatabaseTokenBlacklistService.ShouldRejectUserSession(
            userExists: true,
            isDeleted: false,
            status: UserStatusPolicy.Active,
            suspendedUntil: null,
            lastInvalidatedAt: UtcNow,
            tokenIssuedAt: new DateTimeOffset(UtcNow.AddSeconds(issuedOffsetSeconds)),
            utcNow: UtcNow.AddMinutes(1));

        Assert.Equal(expectedRejected, rejected);
    }

    [Fact]
    public void ShouldRejectUserSession_DistinguishesTokensWithinSameSecond()
    {
        DateTime invalidatedAt = UtcNow.AddMilliseconds(500);

        bool earlierTokenRejected = DatabaseTokenBlacklistService.ShouldRejectUserSession(
            userExists: true,
            isDeleted: false,
            status: UserStatusPolicy.Active,
            suspendedUntil: null,
            lastInvalidatedAt: invalidatedAt,
            tokenIssuedAt: new DateTimeOffset(UtcNow.AddMilliseconds(250)),
            utcNow: UtcNow.AddSeconds(1));
        bool laterTokenRejected = DatabaseTokenBlacklistService.ShouldRejectUserSession(
            userExists: true,
            isDeleted: false,
            status: UserStatusPolicy.Active,
            suspendedUntil: null,
            lastInvalidatedAt: invalidatedAt,
            tokenIssuedAt: new DateTimeOffset(UtcNow.AddMilliseconds(750)),
            utcNow: UtcNow.AddSeconds(1));

        Assert.True(earlierTokenRejected);
        Assert.False(laterTokenRejected);
    }

    [Fact]
    public void ApplyDeletionState_SoftDeletesUserAndInvalidatesExistingTokens()
    {
        var user = new UserEntity
        {
            IsDeleted = false,
            LastInvalidatedAt = null
        };

        UserDataAccessAdapter.ApplyDeletionState(user, UtcNow);

        Assert.True(user.IsDeleted);
        Assert.Equal(UtcNow, user.LastInvalidatedAt);
    }

    [Fact]
    public void HasSecurityStateChanged_DoesNotInvalidateTrustedVerificationOrPendingTwoFactorSetup()
    {
        var entity = new UserEntity
        {
            UserID = 7,
            HashedPassword = "hash",
            Email = "user@example.com",
            Status = UserStatusPolicy.Active,
            RoleID = 1,
            IsDeleted = false,
            TwoFactorEnabled = false,
            TwoFactorSecret = null,
            TwoFactorPendingSecret = null,
            SuspendedUntil = null,
            IsEmailVerified = false
        };
        var model = new UserModel(
            userid: 7,
            hashedpassword: "hash",
            email: "user@example.com",
            firstname: "Test",
            lastname: "User",
            phone: null,
            cityId: null,
            areaId: null,
            bio: null,
            avatar: null,
            joindate: UtcNow,
            status: UserStatusPolicy.Active,
            roleid: 1,
            isdeleted: false,
            twoFactorEnabled: false,
            twoFactorSecret: null,
            twoFactorPendingSecret: "pending-secret",
            suspendedUntil: null,
            isEmailVerified: true);

        Assert.False(UserDataAccessAdapter.HasSecurityStateChanged(entity, model, "hash"));
    }

    [Fact]
    public void HasSecurityStateChanged_InvalidatesFinalTwoFactorAndSuspensionChanges()
    {
        var entity = new UserEntity
        {
            HashedPassword = "hash",
            Email = "user@example.com",
            Status = UserStatusPolicy.Active,
            RoleID = 1
        };
        var model = new UserModel(
            userid: 7,
            hashedpassword: "hash",
            email: "user@example.com",
            firstname: "Test",
            lastname: "User",
            phone: null,
            cityId: null,
            areaId: null,
            bio: null,
            avatar: null,
            joindate: UtcNow,
            status: UserStatusPolicy.Active,
            roleid: 1,
            isdeleted: false,
            twoFactorEnabled: true,
            twoFactorSecret: "active-secret",
            suspendedUntil: UtcNow.AddHours(1));

        Assert.True(UserDataAccessAdapter.HasSecurityStateChanged(entity, model, "hash"));
    }
}
