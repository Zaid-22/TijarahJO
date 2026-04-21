using System;
using System.Threading;
using System.Threading.Tasks;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Application.Services;

public sealed class AdminQueryHandler : IAdminQueryHandler
{
    private readonly IAdminDataAccess _adminDataAccess;

    public AdminQueryHandler(IAdminDataAccess adminDataAccess)
    {
        _adminDataAccess = adminDataAccess;
    }

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
            return new DashboardStatsQueryResult
            {
                Success = false,
                StatusCode = 500,
                Message = $"Error retrieving dashboard stats: {ex.Message}"
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
            return new AdminPostsQueryResult
            {
                Success = false,
                StatusCode = 500,
                Message = $"Error retrieving admin posts: {ex.Message}"
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
            return new AdminUserDetailsQueryResult
            {
                Success = false,
                StatusCode = 500,
                Message = $"Error retrieving user details: {ex.Message}"
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
            return new AdminReviewsQueryResult
            {
                Success = false,
                StatusCode = 500,
                Message = $"Error retrieving admin reviews: {ex.Message}"
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
            return new AdminReviewDeleteResult
            {
                Success = false,
                StatusCode = 500,
                Message = $"Error deleting review: {ex.Message}"
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
            return new AdminPostCommentsQueryResult
            {
                Success = false,
                StatusCode = 500,
                Message = $"Error retrieving admin post comments: {ex.Message}"
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
            return new AdminPostCommentDeleteResult
            {
                Success = false,
                StatusCode = 500,
                Message = $"Error deleting post comment: {ex.Message}"
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
            return new AdminAuditLogQueryResult
            {
                Success = false,
                StatusCode = 500,
                Message = $"Error retrieving audit logs: {ex.Message}"
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
            return new AdminSettingsQueryResult { Success = false, StatusCode = 500, Message = $"Error retrieving settings: {ex.Message}" };
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
            return new AdminSettingUpdateResult { Success = false, StatusCode = 500, Message = $"Error updating setting: {ex.Message}" };
        }
    }

    // ── Phase 3: Chat Inspection ──

    public async Task<AdminConversationsQueryResult> GetConversationsAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _adminDataAccess.GetConversationsAsync(pageNumber, pageSize, cancellationToken);
            return new AdminConversationsQueryResult { Success = true, StatusCode = 200, Result = result };
        }
        catch (Exception ex)
        {
            return new AdminConversationsQueryResult { Success = false, StatusCode = 500, Message = $"Error retrieving conversations: {ex.Message}" };
        }
    }

    public async Task<AdminConversationDetailQueryResult> GetConversationMessagesAsync(int conversationId, CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _adminDataAccess.GetConversationMessagesAsync(conversationId, cancellationToken);
            if (result == null)
                return new AdminConversationDetailQueryResult { Success = false, StatusCode = 404, Message = "Conversation not found." };
            return new AdminConversationDetailQueryResult { Success = true, StatusCode = 200, Result = result };
        }
        catch (Exception ex)
        {
            return new AdminConversationDetailQueryResult { Success = false, StatusCode = 500, Message = $"Error retrieving conversation: {ex.Message}" };
        }
    }
}
