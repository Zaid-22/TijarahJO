using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TijarahJo.Api.Features.Admin;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Domain.Entities;
using TijarahJo.Domain.Enums;
using TijarahJo.Domain.Models;
using TijarahJo.Infrastructure.DataAccess;

namespace TijarahJo.Api.Tests;

public sealed class AdminUsersControllerTests
{
    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(double.NaN)]
    [InlineData(double.PositiveInfinity)]
    public async Task SuspendUser_ReturnsBadRequest_WhenDurationIsNotPositive(double durationHours)
    {
        var adminData = new RecordingAdminDataAccess();
        var controller = CreateController(adminData);

        ActionResult result = await controller.SuspendUser(
            12,
            new SuspendUserRequest { DurationHours = durationHours });

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.False(adminData.SuspendUserCalled);
    }

    [Fact]
    public async Task SuspendUser_AllowsNullDuration_ForPermanentBan()
    {
        var adminData = new RecordingAdminDataAccess();
        var controller = CreateController(adminData);

        ActionResult result = await controller.SuspendUser(
            12,
            new SuspendUserRequest { DurationHours = null });

        Assert.IsType<OkObjectResult>(result);
        Assert.True(adminData.SuspendUserCalled);
        Assert.Null(adminData.LastSuspendedUntil);
        Assert.Equal(42, adminData.LastAdminUserId);
    }

    [Fact]
    public async Task SuspendUser_AllowsPositiveDuration()
    {
        var adminData = new RecordingAdminDataAccess();
        var controller = CreateController(adminData);

        ActionResult result = await controller.SuspendUser(
            12,
            new SuspendUserRequest { DurationHours = 1 });

        Assert.IsType<OkObjectResult>(result);
        Assert.True(adminData.SuspendUserCalled);
        Assert.NotNull(adminData.LastSuspendedUntil);
        Assert.True(adminData.LastSuspendedUntil > DateTime.UtcNow);
    }

    [Fact]
    public void ApplySuspensionState_UsesActiveStatus_ForTimedSuspension()
    {
        var user = new UserEntity { Status = (int)UserStatus.Banned };
        var suspendedUntil = DateTime.UtcNow.AddHours(24);

        AdminDataAccessAdapter.ApplySuspensionState(user, suspendedUntil);

        Assert.Equal((int)UserStatus.Active, user.Status);
        Assert.Equal(suspendedUntil, user.SuspendedUntil);
    }

    [Fact]
    public void ApplySuspensionState_UsesBannedStatus_ForPermanentSuspension()
    {
        var user = new UserEntity
        {
            Status = (int)UserStatus.Active,
            SuspendedUntil = DateTime.UtcNow.AddHours(24)
        };

        AdminDataAccessAdapter.ApplySuspensionState(user, null);

        Assert.Equal((int)UserStatus.Banned, user.Status);
        Assert.Null(user.SuspendedUntil);
    }

    private static AdminUsersController CreateController(RecordingAdminDataAccess adminData)
    {
        return new AdminUsersController(new ThrowingAdminQueryHandler(), adminData)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(
                        new ClaimsIdentity(
                            [new Claim(ClaimTypes.NameIdentifier, "42")],
                            "Test"))
                }
            }
        };
    }

    private sealed class ThrowingAdminQueryHandler : IAdminQueryHandler
    {
        public Task<DashboardStatsQueryResult> GetDashboardStatsAsync(CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<AdminPostsQueryResult> GetAdminPostsAsync(AdminPostFilter filter, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<AdminUserDetailsQueryResult> GetAdminUserDetailsAsync(int userId, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<AdminReviewsQueryResult> GetAdminReviewsAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<AdminReviewDeleteResult> SoftDeleteReviewAsync(int reviewId, int adminUserId, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<AdminPostCommentsQueryResult> GetAdminPostCommentsAsync(string? search = null, int? userId = null, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<AdminPostCommentDeleteResult> SoftDeletePostCommentAsync(int commentId, int adminUserId, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<AdminAuditLogQueryResult> GetAuditLogsAsync(string? tableName = null, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<AdminSettingsQueryResult> GetAllSettingsAsync(CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<AdminSettingUpdateResult> UpdateSettingAsync(string key, string value, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();
    }

    private sealed class RecordingAdminDataAccess : IAdminDataAccess
    {
        public bool SuspendUserCalled { get; private set; }
        public DateTime? LastSuspendedUntil { get; private set; }
        public int LastAdminUserId { get; private set; }

        public Task<bool> SuspendUserAsync(int userId, DateTime? suspendedUntil, int adminUserId, CancellationToken cancellationToken = default)
        {
            SuspendUserCalled = true;
            LastSuspendedUntil = suspendedUntil;
            LastAdminUserId = adminUserId;
            return Task.FromResult(true);
        }

        public Task<IReadOnlyList<AdminCityItem>> GetCitiesWithAreasAsync(CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<int> CreateCityAsync(string cityName, string cityNameAr, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<bool> UpdateCityAsync(int cityId, string cityName, string cityNameAr, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<bool> DeleteCityAsync(int cityId, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<int> CreateAreaAsync(int cityId, string areaName, string areaNameAr, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<bool> UpdateAreaAsync(int areaId, string areaName, string areaNameAr, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<bool> DeleteAreaAsync(int areaId, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<AdminReportListResult> GetReportsAsync(int? status = null, string? reportType = null, string? search = null, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<bool> UpdateReportStatusAsync(int reportId, int newStatus, int adminUserId, string? resolutionNotes = null, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<DashboardStatsModel> GetDashboardStatsAsync(CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<AdminPostListResult> GetAdminPostsAsync(AdminPostFilter filter, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<AdminUserDetails?> GetAdminUserDetailsAsync(int userId, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<int> BulkUpdateUserStatusAsync(IReadOnlyList<int> userIds, int newStatusId, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<AdminReviewListResult> GetAdminReviewsAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<bool> SoftDeleteReviewAsync(int reviewId, int adminUserId, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<AdminPostCommentListResult> GetAdminPostCommentsAsync(string? search = null, int? userId = null, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<bool> SoftDeletePostCommentAsync(int commentId, int adminUserId, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<bool> SoftDeletePostAsync(int postId, int adminUserId, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<AdminAuditLogResult> GetAuditLogsAsync(string? tableName = null, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<IReadOnlyList<SystemSettingItem>> GetAllSettingsAsync(CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<bool> UpdateSettingAsync(string key, string value, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();
    }
}
