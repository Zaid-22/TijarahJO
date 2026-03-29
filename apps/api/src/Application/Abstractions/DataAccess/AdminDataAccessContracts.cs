using System.Threading;
using System.Threading.Tasks;

namespace TijarahJo.Application.Abstractions.DataAccess;

public sealed class DashboardStatsModel
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
    public System.Collections.Generic.IReadOnlyList<RecentAdminAction> RecentActions { get; init; } = System.Array.Empty<RecentAdminAction>();
}

public sealed class RecentAdminAction
{
    public string ActorName { get; init; } = string.Empty;
    public string ActionType { get; init; } = string.Empty;
    public string TableName { get; init; } = string.Empty;
    public System.DateTime ChangedAt { get; init; }
}

public sealed class AdminPostFilter
{
    public int? Status { get; init; }
    public int? CategoryId { get; init; }
    public int? CityId { get; init; }
}

public sealed class AdminPostItem
{
    public int PostID { get; init; }
    public string Title { get; init; } = string.Empty;
    public decimal? Price { get; init; }
    public int Status { get; init; }
    public int CategoryID { get; init; }
    public string CategoryName { get; init; } = string.Empty;
    public int UserID { get; init; }
    public string SellerName { get; init; } = string.Empty;
    public long Views { get; init; }
    public System.DateTime CreatedAt { get; init; }
}

public sealed class AdminPostListResult
{
    public System.Collections.Generic.IReadOnlyList<AdminPostItem> Posts { get; init; } = System.Array.Empty<AdminPostItem>();
    public int TotalCount { get; init; }
}

public sealed class AdminUserDetails
{
    public AdminUserProfile? User { get; init; }
    public System.Collections.Generic.IReadOnlyList<AdminPostItem> RecentPosts { get; init; } = System.Array.Empty<AdminPostItem>();
    public System.Collections.Generic.IReadOnlyList<TijarahJo.Domain.Models.ReviewModel> RecentReviews { get; init; } = System.Array.Empty<TijarahJo.Domain.Models.ReviewModel>();
}

public sealed class AdminUserProfile
{
    public int UserID { get; init; }
    public string Email { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string? Phone { get; init; }
    public int? CityID { get; init; }
    public int? AreaID { get; init; }
    public string? Bio { get; init; }
    public string? Avatar { get; init; }
    public System.DateTime JoinDate { get; init; }
    public int Status { get; init; }
    public int RoleID { get; init; }
    public bool IsDeleted { get; init; }
    public bool TwoFactorEnabled { get; init; }
}

// ── Phase 2: Reviews Moderation ──

public sealed class AdminReviewItem
{
    public int ReviewID { get; init; }
    public int ReviewerID { get; init; }
    public string ReviewerName { get; init; } = string.Empty;
    public int ReviewedUserID { get; init; }
    public string ReviewedUserName { get; init; } = string.Empty;
    public int Rating { get; init; }
    public string Comment { get; init; } = string.Empty;
    public System.DateTime CreatedAt { get; init; }
}

public sealed class AdminReviewListResult
{
    public System.Collections.Generic.IReadOnlyList<AdminReviewItem> Reviews { get; init; } = System.Array.Empty<AdminReviewItem>();
    public int TotalCount { get; init; }
}

// ── Phase 2: Audit Log ──

public sealed class AdminAuditLogItem
{
    public long AuditLogID { get; init; }
    public string TableName { get; init; } = string.Empty;
    public int RecordID { get; init; }
    public string Action { get; init; } = string.Empty;
    public int? ChangedByUserID { get; init; }
    public string? ChangedByUserName { get; init; }
    public System.DateTime ChangedAt { get; init; }
    public string? OldValues { get; init; }
    public string? NewValues { get; init; }
}

public sealed class AdminAuditLogResult
{
    public System.Collections.Generic.IReadOnlyList<AdminAuditLogItem> Entries { get; init; } = System.Array.Empty<AdminAuditLogItem>();
    public int TotalCount { get; init; }
}

public interface IAdminDataAccess
{
    Task<DashboardStatsModel> GetDashboardStatsAsync(CancellationToken cancellationToken = default);
    Task<AdminPostListResult> GetAdminPostsAsync(AdminPostFilter filter, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default);
    Task<AdminUserDetails?> GetAdminUserDetailsAsync(int userId, CancellationToken cancellationToken = default);
    Task<int> BulkUpdateUserStatusAsync(System.Collections.Generic.IReadOnlyList<int> userIds, int newStatusId, CancellationToken cancellationToken = default);

    // Phase 2
    Task<AdminReviewListResult> GetAdminReviewsAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default);
    Task<bool> SoftDeleteReviewAsync(int reviewId, int adminUserId, CancellationToken cancellationToken = default);
    Task<AdminAuditLogResult> GetAuditLogsAsync(string? tableName = null, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default);

    // Phase 3
    Task<System.Collections.Generic.IReadOnlyList<SystemSettingItem>> GetAllSettingsAsync(CancellationToken cancellationToken = default);
    Task<bool> UpdateSettingAsync(string key, string value, CancellationToken cancellationToken = default);
    Task<AdminConversationListResult> GetConversationsAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default);
    Task<AdminConversationDetail?> GetConversationMessagesAsync(int conversationId, CancellationToken cancellationToken = default);

    // Locations CRUD
    Task<System.Collections.Generic.IReadOnlyList<AdminCityItem>> GetCitiesWithAreasAsync(CancellationToken cancellationToken = default);
    Task<int> CreateCityAsync(string cityName, CancellationToken cancellationToken = default);
    Task<bool> UpdateCityAsync(int cityId, string cityName, CancellationToken cancellationToken = default);
    Task<bool> DeleteCityAsync(int cityId, CancellationToken cancellationToken = default);
    Task<int> CreateAreaAsync(int cityId, string areaName, CancellationToken cancellationToken = default);
    Task<bool> UpdateAreaAsync(int areaId, string areaName, CancellationToken cancellationToken = default);
    Task<bool> DeleteAreaAsync(int areaId, CancellationToken cancellationToken = default);

    // Reports
    Task<AdminReportListResult> GetReportsAsync(int? status = null, string? reportType = null, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default);
    Task<bool> UpdateReportStatusAsync(int reportId, int newStatus, int adminUserId, string? resolutionNotes = null, CancellationToken cancellationToken = default);
}

// ── Phase 3: System Settings ──

public sealed class SystemSettingItem
{
    public int SettingID { get; init; }
    public string SettingKey { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
    public string Value { get; init; } = string.Empty;
    public string ValueType { get; init; } = "bool";
    public string? Description { get; init; }
    public System.DateTime UpdatedAt { get; init; }
}

// ── Phase 3: Chat Inspection ──

public sealed class AdminConversationItem
{
    public int ConversationID { get; init; }
    public int User1ID { get; init; }
    public string User1Name { get; init; } = string.Empty;
    public int User2ID { get; init; }
    public string User2Name { get; init; } = string.Empty;
    public int? PostID { get; init; }
    public System.DateTime? LastMessageAt { get; init; }
    public int MessageCount { get; init; }
}

public sealed class AdminConversationListResult
{
    public System.Collections.Generic.IReadOnlyList<AdminConversationItem> Conversations { get; init; } = System.Array.Empty<AdminConversationItem>();
    public int TotalCount { get; init; }
}

public sealed class AdminMessageItem
{
    public int MessageID { get; init; }
    public int SenderID { get; init; }
    public string SenderName { get; init; } = string.Empty;
    public string Content { get; init; } = string.Empty;
    public System.DateTime CreatedAt { get; init; }
    public bool IsRead { get; init; }
}

public sealed class AdminConversationDetail
{
    public AdminConversationItem Conversation { get; init; } = new();
    public System.Collections.Generic.IReadOnlyList<AdminMessageItem> Messages { get; init; } = System.Array.Empty<AdminMessageItem>();
}

// ── Locations ──

public sealed class AdminAreaItem
{
    public int AreaID { get; init; }
    public int CityID { get; init; }
    public string AreaName { get; init; } = string.Empty;
}

public sealed class AdminCityItem
{
    public int CityID { get; init; }
    public string CityName { get; init; } = string.Empty;
    public System.Collections.Generic.IReadOnlyList<AdminAreaItem> Areas { get; init; } = System.Array.Empty<AdminAreaItem>();
}

// ── Reports ──

public sealed class AdminReportItem
{
    public int ReportID { get; init; }
    public string ReportType { get; init; } = string.Empty;
    public int TargetID { get; init; }
    public string? TargetLabel { get; init; }
    public string Reason { get; init; } = string.Empty;
    public string? Description { get; init; }
    public int ReporterUserID { get; init; }
    public string ReporterName { get; init; } = string.Empty;
    public int Status { get; init; }
    public string StatusLabel { get; init; } = string.Empty;
    public int? ResolvedByUserID { get; init; }
    public string? ResolvedByName { get; init; }
    public string? ResolutionNotes { get; init; }
    public System.DateTime CreatedAt { get; init; }
    public System.DateTime? ResolvedAt { get; init; }
}

public sealed class AdminReportListResult
{
    public System.Collections.Generic.IReadOnlyList<AdminReportItem> Reports { get; init; } = System.Array.Empty<AdminReportItem>();
    public int TotalCount { get; init; }
}
