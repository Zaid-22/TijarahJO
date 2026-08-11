using TijarahJo.Application.Common;
using TijarahJo.Application.Abstractions.DataAccess;
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
    public void ApplyUserUpdateFields_DoesNotInvalidateTrustedVerificationOrPendingTwoFactorSetup()
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

        bool securityStateChanged = UserDataAccessAdapter.ApplyUserUpdateFields(
            entity,
            model,
            UserUpdateFields.TwoFactorPendingSecret | UserUpdateFields.IsEmailVerified);

        Assert.False(securityStateChanged);
        Assert.Equal("pending-secret", entity.TwoFactorPendingSecret);
        Assert.True(entity.IsEmailVerified);
    }

    [Fact]
    public void ApplyUserUpdateFields_InvalidatesFinalTwoFactorAndSuspensionChanges()
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

        bool securityStateChanged = UserDataAccessAdapter.ApplyUserUpdateFields(
            entity,
            model,
            UserUpdateFields.TwoFactorEnabled |
            UserUpdateFields.TwoFactorSecret |
            UserUpdateFields.SuspendedUntil);

        Assert.True(securityStateChanged);
    }

    [Fact]
    public void ApplyUserUpdateFields_ProfilePatchPreservesConcurrentSecurityState()
    {
        DateTime suspendedUntil = UtcNow.AddHours(4);
        var entity = new UserEntity
        {
            UserID = 7,
            HashedPassword = "current-hash",
            Email = "user@example.com",
            FirstName = "Before",
            LastName = "User",
            Status = 2,
            RoleID = 9,
            IsDeleted = true,
            TwoFactorEnabled = true,
            TwoFactorSecret = "current-secret",
            TwoFactorPendingSecret = "current-pending",
            SuspendedUntil = suspendedUntil
        };
        var staleProfile = new UserModel(
            userid: 7,
            hashedpassword: "stale-hash",
            email: "user@example.com",
            firstname: "Updated",
            lastname: "User",
            phone: null,
            cityId: null,
            areaId: null,
            bio: null,
            avatar: "/uploads/user-avatars/new.webp",
            joindate: UtcNow,
            status: UserStatusPolicy.Active,
            roleid: 1,
            isdeleted: false,
            twoFactorEnabled: false,
            twoFactorSecret: null,
            twoFactorPendingSecret: null,
            suspendedUntil: null);

        bool securityStateChanged = UserDataAccessAdapter.ApplyUserUpdateFields(
            entity,
            staleProfile,
            UserUpdateFields.FirstName | UserUpdateFields.Avatar);

        Assert.False(securityStateChanged);
        Assert.Equal("Updated", entity.FirstName);
        Assert.Equal("/uploads/user-avatars/new.webp", entity.Avatar);
        Assert.Equal("current-hash", entity.HashedPassword);
        Assert.Equal(2, entity.Status);
        Assert.Equal(9, entity.RoleID);
        Assert.True(entity.IsDeleted);
        Assert.True(entity.TwoFactorEnabled);
        Assert.Equal("current-secret", entity.TwoFactorSecret);
        Assert.Equal("current-pending", entity.TwoFactorPendingSecret);
        Assert.Equal(suspendedUntil, entity.SuspendedUntil);
    }
}
