using System.Threading;
using System.Threading.Tasks;

namespace TijarahJo.Application.Abstractions.Services;

public sealed class DashboardStatsResponse
{
    public int TotalUsers { get; init; }
    public int ActiveUsers { get; init; }
    public int TotalPosts { get; init; }
    public int ActiveListings { get; init; }
    public int BlockedListings { get; init; }
    public int TotalCategories { get; init; }
    public int NewUsersThisWeek { get; init; }
    public int TotalReviews { get; init; }
    public double AverageRating { get; init; }
    public int SoldPosts { get; init; }
    public System.Collections.Generic.IReadOnlyList<TijarahJo.Application.Abstractions.DataAccess.RecentAdminAction> RecentActions { get; init; } = System.Array.Empty<TijarahJo.Application.Abstractions.DataAccess.RecentAdminAction>();

    // Optional metrics that can be added later
    public int PendingReports { get; init; } = 0;
    public decimal TotalRevenue { get; init; } = 0;
}

public sealed class DashboardStatsQueryResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string? Message { get; init; }
    public DashboardStatsResponse? Stats { get; init; }
}

public sealed class AdminPostsQueryResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string? Message { get; init; }
    public TijarahJo.Application.Abstractions.DataAccess.AdminPostListResult? Result { get; init; }
}

public sealed class AdminUserDetailsQueryResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string? Message { get; init; }
    public TijarahJo.Application.Abstractions.DataAccess.AdminUserDetails? Result { get; init; }
}

// Phase 2

public sealed class AdminReviewsQueryResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string? Message { get; init; }
    public TijarahJo.Application.Abstractions.DataAccess.AdminReviewListResult? Result { get; init; }
}

public sealed class AdminReviewDeleteResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string? Message { get; init; }
}

public sealed class AdminPostCommentsQueryResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string? Message { get; init; }
    public TijarahJo.Application.Abstractions.DataAccess.AdminPostCommentListResult? Result { get; init; }
}

public sealed class AdminPostCommentDeleteResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string? Message { get; init; }
}

public sealed class AdminAuditLogQueryResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string? Message { get; init; }
    public TijarahJo.Application.Abstractions.DataAccess.AdminAuditLogResult? Result { get; init; }
}

public interface IAdminQueryHandler
{
    Task<DashboardStatsQueryResult> GetDashboardStatsAsync(CancellationToken cancellationToken = default);
    Task<AdminPostsQueryResult> GetAdminPostsAsync(TijarahJo.Application.Abstractions.DataAccess.AdminPostFilter filter, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default);
    Task<AdminUserDetailsQueryResult> GetAdminUserDetailsAsync(int userId, CancellationToken cancellationToken = default);

    // Phase 2
    Task<AdminReviewsQueryResult> GetAdminReviewsAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default);
    Task<AdminReviewDeleteResult> SoftDeleteReviewAsync(int reviewId, int adminUserId, CancellationToken cancellationToken = default);
    Task<AdminPostCommentsQueryResult> GetAdminPostCommentsAsync(string? search = null, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default);
    Task<AdminPostCommentDeleteResult> SoftDeletePostCommentAsync(int commentId, int adminUserId, CancellationToken cancellationToken = default);
    Task<AdminAuditLogQueryResult> GetAuditLogsAsync(string? tableName = null, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default);

    // Phase 3
    Task<AdminSettingsQueryResult> GetAllSettingsAsync(CancellationToken cancellationToken = default);
    Task<AdminSettingUpdateResult> UpdateSettingAsync(string key, string value, CancellationToken cancellationToken = default);
    Task<AdminConversationsQueryResult> GetConversationsAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default);
    Task<AdminConversationDetailQueryResult> GetConversationMessagesAsync(int conversationId, CancellationToken cancellationToken = default);
}

// Phase 3

public sealed class AdminSettingsQueryResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string? Message { get; init; }
    public System.Collections.Generic.IReadOnlyList<TijarahJo.Application.Abstractions.DataAccess.SystemSettingItem>? Settings { get; init; }
}

public sealed class AdminSettingUpdateResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string? Message { get; init; }
}

public sealed class AdminConversationsQueryResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string? Message { get; init; }
    public TijarahJo.Application.Abstractions.DataAccess.AdminConversationListResult? Result { get; init; }
}

public sealed class AdminConversationDetailQueryResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string? Message { get; init; }
    public TijarahJo.Application.Abstractions.DataAccess.AdminConversationDetail? Result { get; init; }
}
