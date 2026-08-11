using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Domain.Entities;
using TijarahJo.Domain.Enums;
using TijarahJo.Infrastructure.Persistence;

namespace TijarahJo.Infrastructure.DataAccess;

public sealed class AdminDataAccessAdapter(TijarahJoDbContext dbContext, ILogger<AdminDataAccessAdapter> logger) : IAdminDataAccess
{
    private readonly TijarahJoDbContext _dbContext = dbContext;
    private readonly ILogger<AdminDataAccessAdapter> _logger = logger;

    public async Task<DashboardStatsModel> GetDashboardStatsAsync(CancellationToken cancellationToken = default)
    {
        int totalUsers = 0, activeUsers = 0, newUsersThisWeek = 0;
        int totalPosts = 0, activeListings = 0, blockedListings = 0, soldPosts = 0;
        int totalCategories = 0;
        int totalReviews = 0;
        double averageRating = 0;
        var recentActions = new System.Collections.Generic.List<RecentAdminAction>();

        // Users — single query for all counts
        try
        {
            var oneWeekAgo = System.DateTime.UtcNow.AddDays(-7);
            var userStats = await _dbContext.Users
                .Where(u => !u.IsDeleted)
                .GroupBy(u => 1)
                .Select(g => new
                {
                    Total = g.Count(),
                    Active = g.Count(u => u.Status == (int)UserStatus.Active),
                    NewThisWeek = g.Count(u => u.JoinDate >= oneWeekAgo)
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (userStats != null)
            {
                totalUsers = userStats.Total;
                activeUsers = userStats.Active;
                newUsersThisWeek = userStats.NewThisWeek;
            }
        }
        catch (System.Exception ex) { _logger.LogWarning(ex, "Dashboard: failed to load user counts."); }

        // Posts — single query for all counts
        try
        {
            var postStats = await _dbContext.Posts
                .Where(p => !p.IsDeleted)
                .GroupBy(p => 1)
                .Select(g => new
                {
                    Total = g.Count(),
                    Active = g.Count(p => p.Status == (int)PostStatus.Active),
                    Blocked = g.Count(p => p.Status == (int)PostStatus.Blocked),
                    Sold = g.Count(p => p.Status == (int)PostStatus.Sold)
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (postStats != null)
            {
                totalPosts = postStats.Total;
                activeListings = postStats.Active;
                blockedListings = postStats.Blocked;
                soldPosts = postStats.Sold;
            }
        }
        catch (System.Exception ex) { _logger.LogWarning(ex, "Dashboard: failed to load post counts."); }

        // Categories
        try
        {
            totalCategories = await _dbContext.Categories.CountAsync(c => !c.IsDeleted, cancellationToken);
        }
        catch (System.Exception ex) { _logger.LogWarning(ex, "Dashboard: failed to load category count."); }

        // Reviews
        try
        {
            totalReviews = await _dbContext.Reviews.CountAsync(r => !r.IsDeleted, cancellationToken);
            averageRating = await _dbContext.Reviews
                .Where(r => !r.IsDeleted)
                .Select(r => (double?)r.Rating)
                .AverageAsync(cancellationToken) ?? 0;
        }
        catch (System.Exception ex) { _logger.LogWarning(ex, "Dashboard: failed to load review stats."); }

        // Recent admin activity (last 10 from audit log)
        try
        {
            recentActions = await (from a in _dbContext.AuditLogs.AsNoTracking()
                                   join u in _dbContext.Users.AsNoTracking().IgnoreQueryFilters() on a.ChangedByUserID equals u.UserID into ug
                                   from u in ug.DefaultIfEmpty()
                                   orderby a.ChangedAt descending
                                   select new RecentAdminAction
                                   {
                                       ActorName = u != null ? (u.FirstName + " " + (u.LastName ?? "")).Trim() : "System",
                                       ActionType = a.Action,
                                       TableName = a.TableName,
                                       ChangedAt = a.ChangedAt
                                   }).Take(10).ToListAsync(cancellationToken);
        }
        catch (System.Exception ex) { _logger.LogWarning(ex, "Dashboard: failed to load recent admin actions."); }

        return new DashboardStatsModel
        {
            TotalUsers = totalUsers,
            ActiveUsers = activeUsers,
            TotalPosts = totalPosts,
            ActiveListings = activeListings,
            BlockedListings = blockedListings,
            TotalCategories = totalCategories,
            NewUsersThisWeek = newUsersThisWeek,
            TotalReviews = totalReviews,
            AverageRating = System.Math.Round(averageRating, 1),
            SoldPosts = soldPosts,
            RecentActions = recentActions
        };
    }

    public async Task<AdminPostListResult> GetAdminPostsAsync(AdminPostFilter filter, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
    {
        var query = from p in _dbContext.Posts.AsNoTracking()
                    join u in _dbContext.Users.AsNoTracking() on p.UserID equals u.UserID
                    join c in _dbContext.Categories.AsNoTracking() on p.CategoryID equals c.CategoryID
                    where !p.IsDeleted
                    select new { p, u, c };

        if (filter.Status.HasValue)
        {
            query = query.Where(x => x.p.Status == filter.Status.Value);
        }

        if (filter.CategoryId.HasValue)
        {
            query = query.Where(x => x.p.CategoryID == filter.CategoryId.Value);
        }

        if (filter.CityId.HasValue)
        {
            query = query.Where(x => x.p.CityID == filter.CityId.Value);
        }

        int totalCount = await query.CountAsync(cancellationToken);

        int safePage = System.Math.Max(1, pageNumber);
        int safeSize = System.Math.Clamp(pageSize, 1, 200);

        var items = await query
            .OrderByDescending(x => x.p.CreatedAt)
            .Skip((safePage - 1) * safeSize)
            .Take(safeSize)
            .Select(x => new AdminPostItem
            {
                PostID = x.p.PostID,
                Title = x.p.PostTitle ?? string.Empty,
                Price = x.p.Price,
                Status = x.p.Status,
                CategoryID = x.p.CategoryID,
                CategoryName = x.c.CategoryName,
                UserID = x.p.UserID,
                SellerName = x.u.FirstName + " " + x.u.LastName,
                Views = x.p.Views,
                CreatedAt = x.p.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return new AdminPostListResult
        {
            TotalCount = totalCount,
            Posts = items
        };
    }

    public async Task<AdminUserDetails?> GetAdminUserDetailsAsync(int userId, CancellationToken cancellationToken = default)
    {
        var userEntity = await _dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserID == userId, cancellationToken);

        if (userEntity == null)
            return null;

        var recentPosts = await (from p in _dbContext.Posts.AsNoTracking()
                                 join c in _dbContext.Categories.AsNoTracking() on p.CategoryID equals c.CategoryID
                                 where p.UserID == userId && !p.IsDeleted
                                 orderby p.CreatedAt descending
                                 select new AdminPostItem
                                 {
                                     PostID = p.PostID,
                                     Title = p.PostTitle ?? string.Empty,
                                     Price = p.Price,
                                     Status = p.Status,
                                     CategoryID = p.CategoryID,
                                     CategoryName = c.CategoryName,
                                     UserID = p.UserID,
                                     SellerName = userEntity.FirstName + " " + userEntity.LastName,
                                     Views = p.Views,
                                     CreatedAt = p.CreatedAt
                                 })
                                 .Take(10)
                                 .ToListAsync(cancellationToken);

        var recentReviews = await _dbContext.Reviews
            .AsNoTracking()
            .Where(r => r.ReviewedUserID == userId)
            .OrderByDescending(r => r.CreatedAt)
            .Take(10)
            .Select(r => new TijarahJo.Domain.Models.ReviewModel(
                r.ReviewID,
                r.ReviewerID,
                r.ReviewedUserID,
                r.Rating,
                r.Comment ?? string.Empty,
                r.CreatedAt))
            .ToListAsync(cancellationToken);

        var userProfile = new AdminUserProfile
        {
            UserID = userEntity.UserID,
            Email = userEntity.Email,
            FirstName = userEntity.FirstName,
            LastName = userEntity.LastName ?? string.Empty,
            Phone = userEntity.Phone,
            CityID = userEntity.CityID,
            AreaID = userEntity.AreaID,
            Bio = userEntity.Bio,
            Avatar = userEntity.Avatar,
            JoinDate = userEntity.JoinDate,
            Status = userEntity.Status,
            SuspendedUntil = userEntity.SuspendedUntil,
            RoleID = userEntity.RoleID,
            IsDeleted = userEntity.IsDeleted,
            TwoFactorEnabled = userEntity.TwoFactorEnabled
        };

        return new AdminUserDetails
        {
            User = userProfile,
            RecentPosts = recentPosts,
            RecentReviews = recentReviews
        };
    }

    public async Task<int> BulkUpdateUserStatusAsync(System.Collections.Generic.IReadOnlyList<int> userIds, int newStatusId, CancellationToken cancellationToken = default)
    {
        const int maxBulkUsers = 500;
        if (userIds.Count > maxBulkUsers)
        {
            _logger.LogWarning("BulkUpdateUserStatus called with {Count} user IDs which exceeds the safety limit of {Max}. Operation rejected.", userIds.Count, maxBulkUsers);
            throw new System.InvalidOperationException($"Bulk status update is limited to {maxBulkUsers} users per call.");
        }

        var users = await _dbContext.Users
            .Where(u => userIds.Contains(u.UserID) && !u.IsDeleted)
            .ToListAsync(cancellationToken);

        foreach (var user in users)
        {
            bool statusWillBecomeMoreRestrictive = newStatusId != 1 && user.Status != newStatusId;
            user.Status = newStatusId;
            user.SuspendedUntil = null;
            if (statusWillBecomeMoreRestrictive)
            {
                user.LastInvalidatedAt = System.DateTime.UtcNow;
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return users.Count;
    }

    // ── Phase 2: Reviews Moderation ──

    public async Task<AdminReviewListResult> GetAdminReviewsAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
    {
        var query = from r in _dbContext.Reviews.AsNoTracking()
                    join reviewer in _dbContext.Users.AsNoTracking() on r.ReviewerID equals reviewer.UserID
                    join reviewed in _dbContext.Users.AsNoTracking() on r.ReviewedUserID equals reviewed.UserID
                    where !r.IsDeleted
                    select new { r, reviewer, reviewed };

        int totalCount = await query.CountAsync(cancellationToken);

        int safePage = System.Math.Max(1, pageNumber);
        int safeSize = System.Math.Clamp(pageSize, 1, 200);

        var items = await query
            .OrderByDescending(x => x.r.CreatedAt)
            .Skip((safePage - 1) * safeSize)
            .Take(safeSize)
            .Select(x => new AdminReviewItem
            {
                ReviewID = x.r.ReviewID,
                ReviewerID = x.r.ReviewerID,
                ReviewerName = (x.reviewer.FirstName + " " + (x.reviewer.LastName ?? "")).Trim(),
                ReviewedUserID = x.r.ReviewedUserID,
                ReviewedUserName = (x.reviewed.FirstName + " " + (x.reviewed.LastName ?? "")).Trim(),
                Rating = x.r.Rating,
                Comment = x.r.Comment ?? string.Empty,
                CreatedAt = x.r.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return new AdminReviewListResult
        {
            TotalCount = totalCount,
            Reviews = items
        };
    }

    public async Task<bool> SoftDeleteReviewAsync(int reviewId, int adminUserId, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.Reviews.FirstOrDefaultAsync(r => r.ReviewID == reviewId, cancellationToken);
        if (entity == null) return false;

        entity.IsDeleted = true;
        _dbContext.AuditActorUserId = adminUserId;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<AdminPostCommentListResult> GetAdminPostCommentsAsync(string? search = null, int? userId = null, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
    {
        var normalizedSearch = search?.Trim();

        var query =
            from comment in _dbContext.PostComments.AsNoTracking()
            join user in _dbContext.Users.AsNoTracking().IgnoreQueryFilters() on comment.UserID equals user.UserID into userGroup
            from user in userGroup.DefaultIfEmpty()
            join post in _dbContext.Posts.AsNoTracking().IgnoreQueryFilters() on comment.PostID equals post.PostID into postGroup
            from post in postGroup.DefaultIfEmpty()
            select new { comment, user, post };

        query = query.Where(x => !x.comment.IsDeleted);

        if (userId.HasValue)
        {
            query = query.Where(x => x.comment.UserID == userId.Value);
        }

        if (!string.IsNullOrWhiteSpace(normalizedSearch))
        {
            var searchTerm = normalizedSearch!;
            query = query.Where(x =>
                x.comment.Content.Contains(searchTerm) ||
                (x.post != null && (x.post.PostTitle ?? string.Empty).Contains(searchTerm)) ||
                (x.user != null && (
                    ((x.user.FirstName ?? string.Empty) + " " + (x.user.LastName ?? string.Empty)).Trim().Contains(searchTerm) ||
                    (x.user.FirstName ?? string.Empty).Contains(searchTerm) ||
                    (x.user.LastName ?? string.Empty).Contains(searchTerm) ||
                    x.user.Email.Contains(searchTerm) ||
                    (x.user.Phone != null && x.user.Phone.Contains(searchTerm))
                )));
        }

        int totalCount = await query.CountAsync(cancellationToken);

        int safePage = System.Math.Max(1, pageNumber);
        int safeSize = System.Math.Clamp(pageSize, 1, 200);

        // Batch reply counts in a single grouped subquery to avoid N+1 correlated queries.
        // We project the page of comment IDs first, then JOIN to a grouped reply count.
        var pagedCommentIds = await query
            .OrderByDescending(x => x.comment.CreatedAt)
            .ThenByDescending(x => x.comment.CommentID)
            .Skip((safePage - 1) * safeSize)
            .Take(safeSize)
            .Select(x => x.comment.CommentID)
            .ToListAsync(cancellationToken);

        // Single grouped COUNT for all reply counts
        var replyCounts = await _dbContext.PostComments
            .AsNoTracking()
            .Where(reply => !reply.IsDeleted && reply.ParentCommentID.HasValue && pagedCommentIds.Contains(reply.ParentCommentID!.Value))
            .GroupBy(reply => reply.ParentCommentID!.Value)
            .Select(g => new { ParentId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(g => g.ParentId, g => g.Count, cancellationToken);

        var items = await query
            .OrderByDescending(x => x.comment.CreatedAt)
            .ThenByDescending(x => x.comment.CommentID)
            .Skip((safePage - 1) * safeSize)
            .Take(safeSize)
            .Select(x => new AdminPostCommentItem
            {
                CommentID = x.comment.CommentID,
                PostID = x.comment.PostID,
                PostTitle = x.post != null ? x.post.PostTitle ?? string.Empty : string.Empty,
                UserID = x.comment.UserID,
                AuthorName = x.user != null
                    ? ((x.user.FirstName ?? string.Empty) + " " + (x.user.LastName ?? string.Empty)).Trim()
                    : "Unknown user",
                ParentCommentID = x.comment.ParentCommentID,
                ReplyCount = 0, // Populated below from batched reply counts
                Content = x.comment.Content,
                CreatedAt = x.comment.CreatedAt,
                UpdatedAt = x.comment.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        // Apply batched reply counts
        foreach (var item in items)
        {
            item.ReplyCount = replyCounts.TryGetValue(item.CommentID, out int count) ? count : 0;
        }

        return new AdminPostCommentListResult
        {
            TotalCount = totalCount,
            Comments = items
        };
    }

    public async Task<bool> SoftDeletePostCommentAsync(int commentId, int adminUserId, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.PostComments
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(comment => comment.CommentID == commentId, cancellationToken);

        if (entity == null) return false;
        if (entity.IsDeleted) return true;

        entity.IsDeleted = true;
        _dbContext.AuditActorUserId = adminUserId;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> SoftDeletePostAsync(int postId, int adminUserId, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.Posts
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.PostID == postId, cancellationToken);
        if (entity == null) return false;
        // Idempotent: already deleted is still a success
        if (entity.IsDeleted) return true;

        entity.IsDeleted = true;
        _dbContext.AuditActorUserId = adminUserId;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    // ── Phase 2: Audit Log ──

    public async Task<AdminAuditLogResult> GetAuditLogsAsync(string? tableName = null, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.AuditLogs.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(tableName))
        {
            query = query.Where(a => a.TableName == tableName);
        }

        int totalCount = await query.CountAsync(cancellationToken);

        int safePage = System.Math.Max(1, pageNumber);
        int safeSize = System.Math.Clamp(pageSize, 1, 200);

        var items = await query
            .OrderByDescending(a => a.ChangedAt)
            .Skip((safePage - 1) * safeSize)
            .Take(safeSize)
            .GroupJoin(
                _dbContext.Users.AsNoTracking(),
                a => a.ChangedByUserID,
                u => (int?)u.UserID,
                (a, users) => new { a, users })
            .SelectMany(
                x => x.users.DefaultIfEmpty(),
                (x, u) => new AdminAuditLogItem
                {
                    AuditLogID = x.a.AuditLogID,
                    TableName = x.a.TableName,
                    RecordID = x.a.RecordID,
                    Action = x.a.Action,
                    ChangedByUserID = x.a.ChangedByUserID,
                    ChangedByUserName = u != null ? (u.FirstName + " " + (u.LastName ?? "")).Trim() : null,
                    ChangedAt = x.a.ChangedAt,
                    OldValues = x.a.OldValues,
                    NewValues = x.a.NewValues
                })
            .ToListAsync(cancellationToken);

        return new AdminAuditLogResult
        {
            TotalCount = totalCount,
            Entries = items
        };
    }

    // ── Phase 3: System Settings ──

    public async Task<System.Collections.Generic.IReadOnlyList<SystemSettingItem>> GetAllSettingsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return await _dbContext.SystemSettings
                .AsNoTracking()
                .OrderBy(s => s.SettingKey)
                .Select(s => new SystemSettingItem
                {
                    SettingID = s.SettingID,
                    SettingKey = s.SettingKey,
                    Label = s.Label,
                    Value = s.Value,
                    ValueType = s.ValueType,
                    Description = s.Description,
                    UpdatedAt = s.UpdatedAt
                })
                .ToListAsync(cancellationToken);
        }
        catch (System.Exception ex)
        {
            _logger.LogWarning(ex, "Failed to load system settings – table may not exist.");
            return [];
        }
    }

    public async Task<bool> UpdateSettingAsync(string key, string value, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.SystemSettings.FirstOrDefaultAsync(s => s.SettingKey == key, cancellationToken);
        if (entity == null) return false;

        entity.Value = value;
        entity.UpdatedAt = System.DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    // ── Locations CRUD ──

    public async Task<System.Collections.Generic.IReadOnlyList<AdminCityItem>> GetCitiesWithAreasAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Cities
            .AsNoTracking()
            .OrderBy(c => c.CityName)
            .Select(c => new AdminCityItem
            {
                CityID = c.CityID,
                CityName = c.CityName,
                CityNameAr = c.CityNameAr,
                Areas = c.Areas.OrderBy(a => a.AreaName).Select(a => new AdminAreaItem
                {
                    AreaID = a.AreaID,
                    CityID = a.CityID,
                    AreaName = a.AreaName,
                    AreaNameAr = a.AreaNameAr
                }).ToList()
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CreateCityAsync(string cityName, string cityNameAr, CancellationToken cancellationToken = default)
    {
        var entity = new TijarahJo.Domain.Entities.CityEntity { CityName = cityName, CityNameAr = cityNameAr };
        await _dbContext.Cities.AddAsync(entity, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return entity.CityID;
    }

    public async Task<bool> UpdateCityAsync(int cityId, string cityName, string cityNameAr, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.Cities.FindAsync([cityId], cancellationToken);
        if (entity == null) return false;
        entity.CityName = cityName;
        entity.CityNameAr = cityNameAr;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteCityAsync(int cityId, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.Cities
            .Include(c => c.Areas)
            .FirstOrDefaultAsync(c => c.CityID == cityId, cancellationToken);
        if (entity == null) return false;

        var areaIds = entity.Areas.Select(a => a.AreaID).ToList();

        // Nullify FK references in Posts that point to this city or its areas
        var referencingPosts = await _dbContext.Posts
            .IgnoreQueryFilters()
            .Where(p => p.CityID == cityId || (p.AreaID.HasValue && areaIds.Contains(p.AreaID.Value)))
            .ToListAsync(cancellationToken);
        foreach (var post in referencingPosts)
        {
            post.CityID = null;
            post.AreaID = null;
        }

        // Nullify FK references in Users that point to this city or its areas
        var referencingUsers = await _dbContext.Users
            .IgnoreQueryFilters()
            .Where(u => u.CityID == cityId || (u.AreaID.HasValue && areaIds.Contains(u.AreaID.Value)))
            .ToListAsync(cancellationToken);
        foreach (var user in referencingUsers)
        {
            user.CityID = null;
            user.AreaID = null;
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        // First save: flush FK nullifications before deleting the location rows.
        // EF Core doesn't model the DB-level FK_Users_Areas / FK_Posts_Cities constraints,
        // so it may reorder DELETEs before UPDATEs within a single SaveChanges batch.
        await _dbContext.SaveChangesAsync(cancellationToken);

        _dbContext.Areas.RemoveRange(entity.Areas);
        _dbContext.Cities.Remove(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return true;
    }

    public async Task<int> CreateAreaAsync(int cityId, string areaName, string areaNameAr, CancellationToken cancellationToken = default)
    {
        var entity = new TijarahJo.Domain.Entities.AreaEntity { CityID = cityId, AreaName = areaName, AreaNameAr = areaNameAr };
        await _dbContext.Areas.AddAsync(entity, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return entity.AreaID;
    }

    public async Task<bool> UpdateAreaAsync(int areaId, string areaName, string areaNameAr, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.Areas.FindAsync([areaId], cancellationToken);
        if (entity == null) return false;
        entity.AreaName = areaName;
        entity.AreaNameAr = areaNameAr;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteAreaAsync(int areaId, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.Areas.FindAsync([areaId], cancellationToken);
        if (entity == null) return false;

        // Nullify FK references in Posts that point to this area
        var referencingPosts = await _dbContext.Posts
            .IgnoreQueryFilters()
            .Where(p => p.AreaID == areaId)
            .ToListAsync(cancellationToken);
        foreach (var post in referencingPosts)
        {
            post.AreaID = null;
        }

        // Nullify FK references in Users that point to this area
        var referencingUsers = await _dbContext.Users
            .IgnoreQueryFilters()
            .Where(u => u.AreaID == areaId)
            .ToListAsync(cancellationToken);
        foreach (var user in referencingUsers)
        {
            user.AreaID = null;
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        // First save: flush FK nullifications before deleting the area row.
        await _dbContext.SaveChangesAsync(cancellationToken);

        _dbContext.Areas.Remove(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return true;
    }

    // ── Reports ──

    private static readonly string[] _reportStatusLabels = ["Pending", "Under Review", "Resolved", "Dismissed"];

    public async Task<AdminReportListResult> GetReportsAsync(int? status = null, string? reportType = null, string? search = null, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
    {
        try
        {
            var query = _dbContext.Reports.AsNoTracking();

            if (status.HasValue)
                query = query.Where(r => r.Status == status.Value);
            if (!string.IsNullOrWhiteSpace(reportType))
                query = query.Where(r => r.ReportType == reportType);

            // Step 1: join reporter + optional resolver only (no polymorphic target joins)
            var baseJoined = from r in query
                             join reporter in _dbContext.Users.AsNoTracking() on r.ReporterUserID equals reporter.UserID
                             join resolver in _dbContext.Users.AsNoTracking() on r.ResolvedByUserID equals resolver.UserID into rg
                             from resolver in rg.DefaultIfEmpty()
                             select new { r, reporter, resolver };

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                baseJoined = baseJoined.Where(x =>
                    (x.reporter.FirstName + " " + (x.reporter.LastName ?? "")).Contains(term) ||
                    x.reporter.Email.Contains(term) ||
                    (x.reporter.Phone != null && x.reporter.Phone.Contains(term)));
            }

            int totalCount = await baseJoined.CountAsync(cancellationToken);

            int safePage = System.Math.Max(1, pageNumber);
            int safeSize = System.Math.Clamp(pageSize, 1, 200);

            // Step 2: fetch the paged report rows
            var pageRows = await baseJoined
                .OrderByDescending(x => x.r.CreatedAt)
                .Skip((safePage - 1) * safeSize)
                .Take(safeSize)
                .Select(x => new
                {
                    x.r.ReportID,
                    x.r.ReportType,
                    x.r.TargetID,
                    x.r.Reason,
                    x.r.Description,
                    x.r.ImageUrl,
                    x.r.ReporterUserID,
                    x.r.Status,
                    x.r.ResolvedByUserID,
                    x.r.ResolutionNotes,
                    x.r.CreatedAt,
                    x.r.ResolvedAt,
                    ReporterFirstName = x.reporter.FirstName,
                    ReporterLastName = x.reporter.LastName,
                    ReporterEmail = x.reporter.Email,
                    ResolverFirstName = x.resolver != null ? x.resolver.FirstName : null,
                    ResolverLastName = x.resolver != null ? x.resolver.LastName : null,
                })
                .ToListAsync(cancellationToken);

            // Step 3: batch-fetch each target type using only the relevant IDs
            var listingIds  = pageRows.Where(r => r.ReportType == "LISTING").Select(r => r.TargetID).Distinct().ToList();
            var userIds     = pageRows.Where(r => r.ReportType == "USER").Select(r => r.TargetID).Distinct().ToList();
            var reviewIds   = pageRows.Where(r => r.ReportType == "REVIEW").Select(r => r.TargetID).Distinct().ToList();
            var commentIds  = pageRows.Where(r => r.ReportType == "COMMENT").Select(r => r.TargetID).Distinct().ToList();

            // Posts + their owner
            var posts = listingIds.Count == 0 ? [] : await _dbContext.Posts
                .AsNoTracking().IgnoreQueryFilters()
                .Where(p => listingIds.Contains(p.PostID))
                .Select(p => new { p.PostID, p.PostTitle, p.UserID })
                .ToListAsync(cancellationToken);

            var postOwnerIds = posts.Select(p => p.UserID).Distinct().ToList();

            // Target users (USER reports) + post owners + review authors + comment authors
            var allUserIds = userIds
                .Concat(postOwnerIds)
                .Concat(reviewIds.Count == 0 ? [] : await _dbContext.Reviews
                    .AsNoTracking().IgnoreQueryFilters()
                    .Where(r => reviewIds.Contains(r.ReviewID))
                    .Select(r => r.ReviewerID)
                    .ToListAsync(cancellationToken))
                .Concat(commentIds.Count == 0 ? [] : await _dbContext.PostComments
                    .AsNoTracking().IgnoreQueryFilters()
                    .Where(c => commentIds.Contains(c.CommentID))
                    .Select(c => c.UserID)
                    .ToListAsync(cancellationToken))
                .Distinct().ToList();

            var usersMap = allUserIds.Count == 0 ? [] : await _dbContext.Users
                .AsNoTracking().IgnoreQueryFilters()
                .Where(u => allUserIds.Contains(u.UserID))
                .Select(u => new { u.UserID, u.FirstName, u.LastName, u.Status, u.SuspendedUntil })
                .ToDictionaryAsync(u => u.UserID, cancellationToken);

            var reviewsMap = reviewIds.Count == 0 ? [] : await _dbContext.Reviews
                .AsNoTracking().IgnoreQueryFilters()
                .Where(r => reviewIds.Contains(r.ReviewID))
                .Select(r => new { r.ReviewID, r.ReviewerID, r.Comment })
                .ToDictionaryAsync(r => r.ReviewID, cancellationToken);

            var commentsMap = commentIds.Count == 0 ? [] : await _dbContext.PostComments
                .AsNoTracking().IgnoreQueryFilters()
                .Where(c => commentIds.Contains(c.CommentID))
                .Select(c => new { c.CommentID, c.UserID, c.Content })
                .ToDictionaryAsync(c => c.CommentID, cancellationToken);

            var postsMap = posts.ToDictionary(p => p.PostID);

            static string? FullName(dynamic? u) =>
                u == null ? null : ((string)(u.FirstName + " " + (u.LastName ?? ""))).Trim();

            // Step 4: assemble result set in memory
            var items = pageRows.Select(row =>
            {
                string? targetLabel = null;
                int? targetUserId = null;
                string? targetUserName = null;
                int? targetUserStatus = null;
                System.DateTime? targetUserSuspendedUntil = null;

                if (row.ReportType == "LISTING" && postsMap.TryGetValue(row.TargetID, out var post))
                {
                    targetLabel = post.PostTitle;
                    targetUserId = post.UserID;
                    if (usersMap.TryGetValue(post.UserID, out var owner))
                    {
                        targetUserName = FullName(owner);
                        targetUserStatus = owner.Status;
                        targetUserSuspendedUntil = owner.SuspendedUntil;
                    }
                }
                else if (row.ReportType == "USER" && usersMap.TryGetValue(row.TargetID, out var targetUser))
                {
                    targetLabel = FullName(targetUser);
                    targetUserId = targetUser.UserID;
                    targetUserName = FullName(targetUser);
                    targetUserStatus = targetUser.Status;
                    targetUserSuspendedUntil = targetUser.SuspendedUntil;
                }
                else if (row.ReportType == "REVIEW" && reviewsMap.TryGetValue(row.TargetID, out var review))
                {
                    targetLabel = review.Comment;
                    targetUserId = review.ReviewerID;
                    if (usersMap.TryGetValue(review.ReviewerID, out var author))
                    {
                        targetUserName = FullName(author);
                        targetUserStatus = author.Status;
                        targetUserSuspendedUntil = author.SuspendedUntil;
                    }
                }
                else if (row.ReportType == "COMMENT" && commentsMap.TryGetValue(row.TargetID, out var comment))
                {
                    targetLabel = comment.Content;
                    targetUserId = comment.UserID;
                    if (usersMap.TryGetValue(comment.UserID, out var author))
                    {
                        targetUserName = FullName(author);
                        targetUserStatus = author.Status;
                        targetUserSuspendedUntil = author.SuspendedUntil;
                    }
                }

                string? resolverName = row.ResolverFirstName == null
                    ? null
                    : ((string)(row.ResolverFirstName + " " + (row.ResolverLastName ?? ""))).Trim();

                return new AdminReportItem
                {
                    ReportID = row.ReportID,
                    ReportType = row.ReportType,
                    TargetID = row.TargetID,
                    TargetLabel = targetLabel,
                    Reason = row.Reason,
                    Description = row.Description,
                    ImageUrl = row.ImageUrl,
                    ReporterUserID = row.ReporterUserID,
                    ReporterName = ((string)(row.ReporterFirstName + " " + (row.ReporterLastName ?? ""))).Trim(),
                    ReporterEmail = row.ReporterEmail,
                    TargetUserID = targetUserId,
                    TargetUserName = targetUserName,
                    TargetUserStatus = targetUserStatus,
                    TargetUserSuspendedUntil = targetUserSuspendedUntil,
                    Status = row.Status,
                    StatusLabel = row.Status >= 0 && row.Status < _reportStatusLabels.Length ? _reportStatusLabels[row.Status] : "Unknown",
                    ResolvedByUserID = row.ResolvedByUserID,
                    ResolvedByName = resolverName,
                    ResolutionNotes = row.ResolutionNotes,
                    CreatedAt = row.CreatedAt,
                    ResolvedAt = row.ResolvedAt
                };
            }).ToList();

            return new AdminReportListResult { Reports = items, TotalCount = totalCount };
        }
        catch (System.Exception ex)
        {
            _logger.LogWarning(ex, "Failed to load reports – table may not exist.");
            return new AdminReportListResult { Reports = [], TotalCount = 0 };
        }
    }

    public async Task<bool> UpdateReportStatusAsync(int reportId, int newStatus, int adminUserId, string? resolutionNotes = null, CancellationToken cancellationToken = default)
    {
        if (reportId < 1 || adminUserId < 1 || !System.Enum.IsDefined(typeof(ReportStatus), newStatus))
        {
            return false;
        }

        var entity = await _dbContext.Reports.FindAsync([reportId], cancellationToken);
        if (entity == null) return false;

        ApplyReportStatus(entity, newStatus, adminUserId, resolutionNotes, System.DateTime.UtcNow);

        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    internal static void ApplyReportStatus(
        ReportEntity entity,
        int newStatus,
        int adminUserId,
        string? resolutionNotes,
        System.DateTime utcNow)
    {
        if (entity is null)
        {
            throw new System.ArgumentNullException(nameof(entity));
        }

        if (adminUserId < 1 || !System.Enum.IsDefined(typeof(ReportStatus), newStatus))
        {
            throw new System.ArgumentOutOfRangeException(nameof(newStatus));
        }

        entity.Status = newStatus;
        bool isTerminal = newStatus == (int)ReportStatus.Resolved ||
                          newStatus == (int)ReportStatus.Dismissed;
        if (isTerminal)
        {
            entity.ResolvedByUserID = adminUserId;
            entity.ResolvedAt = utcNow;
            entity.ResolutionNotes = string.IsNullOrWhiteSpace(resolutionNotes)
                ? null
                : resolutionNotes.Trim();
        }
        else
        {
            entity.ResolvedByUserID = null;
            entity.ResolvedAt = null;
            entity.ResolutionNotes = null;
        }
    }

    public async Task<bool> SuspendUserAsync(int userId, System.DateTime? suspendedUntil, int adminUserId, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserID == userId, cancellationToken);
        if (user == null) return false;

        ApplySuspensionState(user, suspendedUntil);

        // Invalidate all active sessions immediately
        user.LastInvalidatedAt = System.DateTime.UtcNow;

        _dbContext.AuditActorUserId = adminUserId;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    internal static void ApplySuspensionState(UserEntity user, System.DateTime? suspendedUntil)
    {
        if (suspendedUntil.HasValue)
        {
            // Timed suspensions use ACTIVE status; SuspendedUntil carries the login lockout.
            user.Status = (int)UserStatus.Active;
            user.SuspendedUntil = suspendedUntil.Value;
        }
        else
        {
            // Permanent ban
            user.Status = (int)UserStatus.Banned;
            user.SuspendedUntil = null;
        }
    }
}
