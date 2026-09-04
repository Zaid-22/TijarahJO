using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Application.Services;

public sealed class AdminQueryHandler(
    IAdminDataAccess adminDataAccess,
    ILogger<AdminQueryHandler> logger) : IAdminQueryHandler
{
    private readonly IAdminDataAccess _adminDataAccess = adminDataAccess;
    private readonly ILogger<AdminQueryHandler> _logger = logger;

    public async Task<DashboardStatsQueryResult> GetDashboardStatsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var stats = await _adminDataAccess.GetDashboardStatsAsync(cancellationToken);

            return new DashboardStatsQueryResult
            {
                Success = true,
                StatusCode = 200,
                Stats = new DashboardStatsResponse
                {
                    TotalUsers = stats.TotalUsers,
                    ActiveUsers = stats.ActiveUsers,
                    TotalPosts = stats.TotalPosts,
                    ActiveListings = stats.ActiveListings,
                    BlockedListings = stats.BlockedListings,
                    TotalCategories = stats.TotalCategories,
                    NewUsersThisWeek = stats.NewUsersThisWeek,
                    TotalReviews = stats.TotalReviews,
                    AverageRating = stats.AverageRating,
                    SoldPosts = stats.SoldPosts,
                    RecentActions = stats.RecentActions,
                    PendingReports = 0, // Mock for v1
                    TotalRevenue = 0 // Mock for v1
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve dashboard statistics.");
            return new DashboardStatsQueryResult
            {
                Success = false,
                StatusCode = 500,
                Message = "Failed to retrieve dashboard statistics."
            };
        }
    }

    public async Task<AdminPostsQueryResult> GetAdminPostsAsync(AdminPostFilter filter, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _adminDataAccess.GetAdminPostsAsync(filter, pageNumber, pageSize, cancellationToken);
            return new AdminPostsQueryResult
            {
                Success = true,
                StatusCode = 200,
                Result = result
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve administrative posts.");
            return new AdminPostsQueryResult
            {
                Success = false,
                StatusCode = 500,
                Message = "Failed to retrieve administrative posts."
            };
        }
    }

    public async Task<AdminUserDetailsQueryResult> GetAdminUserDetailsAsync(int userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _adminDataAccess.GetAdminUserDetailsAsync(userId, cancellationToken);
            if (result == null)
            {
                return new AdminUserDetailsQueryResult
                {
                    Success = false,
                    StatusCode = 404,
                    Message = $"User with ID {userId} not found."
                };
            }

            return new AdminUserDetailsQueryResult
            {
                Success = true,
                StatusCode = 200,
                Result = result
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve administrative user details for {UserId}.", userId);
            return new AdminUserDetailsQueryResult
            {
                Success = false,
                StatusCode = 500,
                Message = "Failed to retrieve user details."
            };
        }
    }

    // ── Phase 2: Reviews Moderation ──

    public async Task<AdminReviewsQueryResult> GetAdminReviewsAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _adminDataAccess.GetAdminReviewsAsync(pageNumber, pageSize, cancellationToken);
            return new AdminReviewsQueryResult
            {
                Success = true,
                StatusCode = 200,
                Result = result
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve reviews for moderation.");
            return new AdminReviewsQueryResult
            {
                Success = false,
                StatusCode = 500,
                Message = "Failed to retrieve reviews."
            };
        }
    }

    public async Task<AdminReviewDeleteResult> SoftDeleteReviewAsync(int reviewId, int adminUserId, CancellationToken cancellationToken = default)
    {
        try
        {
            bool deleted = await _adminDataAccess.SoftDeleteReviewAsync(reviewId, adminUserId, cancellationToken);
            if (!deleted)
            {
                return new AdminReviewDeleteResult
                {
                    Success = false,
                    StatusCode = 404,
                    Message = $"Review with ID {reviewId} not found."
                };
            }

            return new AdminReviewDeleteResult
            {
                Success = true,
                StatusCode = 200,
                Message = "Review deleted successfully."
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete review {ReviewId}.", reviewId);
            return new AdminReviewDeleteResult
            {
                Success = false,
                StatusCode = 500,
                Message = "Failed to delete review."
            };
        }
    }

    public async Task<AdminPostCommentsQueryResult> GetAdminPostCommentsAsync(string? search = null, int? userId = null, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _adminDataAccess.GetAdminPostCommentsAsync(search, userId, pageNumber, pageSize, cancellationToken);
            return new AdminPostCommentsQueryResult
            {
                Success = true,
                StatusCode = 200,
                Result = result
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve post comments for moderation.");
            return new AdminPostCommentsQueryResult
            {
                Success = false,
                StatusCode = 500,
                Message = "Failed to retrieve post comments."
            };
        }
    }

    public async Task<AdminPostCommentDeleteResult> SoftDeletePostCommentAsync(int commentId, int adminUserId, CancellationToken cancellationToken = default)
    {
        try
        {
            bool deleted = await _adminDataAccess.SoftDeletePostCommentAsync(commentId, adminUserId, cancellationToken);
            if (!deleted)
            {
                return new AdminPostCommentDeleteResult
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Comment was already deleted or no longer available."
                };
            }

            return new AdminPostCommentDeleteResult
            {
                Success = true,
                StatusCode = 200,
                Message = "Comment deleted successfully."
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete post comment {CommentId}.", commentId);
            return new AdminPostCommentDeleteResult
            {
                Success = false,
                StatusCode = 500,
                Message = "Failed to delete post comment."
            };
        }
    }

    // ── Phase 2: Audit Log ──

    public async Task<AdminAuditLogQueryResult> GetAuditLogsAsync(string? tableName = null, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _adminDataAccess.GetAuditLogsAsync(tableName, pageNumber, pageSize, cancellationToken);
            return new AdminAuditLogQueryResult
            {
                Success = true,
                StatusCode = 200,
                Result = result
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve audit logs.");
            return new AdminAuditLogQueryResult
            {
                Success = false,
                StatusCode = 500,
                Message = "Failed to retrieve audit logs."
            };
        }
    }

    // ── Phase 3: System Settings ──

    public async Task<AdminSettingsQueryResult> GetAllSettingsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var settings = await _adminDataAccess.GetAllSettingsAsync(cancellationToken);
            return new AdminSettingsQueryResult { Success = true, StatusCode = 200, Settings = settings };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve system settings.");
            return new AdminSettingsQueryResult { Success = false, StatusCode = 500, Message = "Failed to retrieve settings." };
        }
    }

    public async Task<AdminSettingUpdateResult> UpdateSettingAsync(string key, string value, CancellationToken cancellationToken = default)
    {
        try
        {
            bool updated = await _adminDataAccess.UpdateSettingAsync(key, value, cancellationToken);
            if (!updated)
                return new AdminSettingUpdateResult { Success = false, StatusCode = 404, Message = $"Setting '{key}' not found." };
            return new AdminSettingUpdateResult { Success = true, StatusCode = 200, Message = "Setting updated." };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update system setting {SettingKey}.", key);
            return new AdminSettingUpdateResult { Success = false, StatusCode = 500, Message = "Failed to update setting." };
        }
    }

}
