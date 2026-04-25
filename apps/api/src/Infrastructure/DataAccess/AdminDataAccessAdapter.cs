using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TijarahJo.Application.Abstractions.DataAccess;
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
        var users = await _dbContext.Users
            .Where(u => userIds.Contains(u.UserID) && !u.IsDeleted)
            .ToListAsync(cancellationToken);

        foreach (var user in users)
        {
            user.Status = newStatusId;
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
                    (x.user.LastName ?? string.Empty).Contains(searchTerm))));
        }

        int totalCount = await query.CountAsync(cancellationToken);

        int safePage = System.Math.Max(1, pageNumber);
        int safeSize = System.Math.Clamp(pageSize, 1, 200);

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
                ReplyCount = _dbContext.PostComments.Count(reply => !reply.IsDeleted && reply.ParentCommentID.HasValue && reply.ParentCommentID.Value == x.comment.CommentID),
                Content = x.comment.Content,
                CreatedAt = x.comment.CreatedAt,
                UpdatedAt = x.comment.UpdatedAt
            })
            .ToListAsync(cancellationToken);

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
        if (entity == null || entity.IsDeleted) return false;

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

    // ── Phase 3: Chat Inspection ──

    public async Task<AdminConversationListResult> GetConversationsAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
    {
        var query = from c in _dbContext.Conversations.AsNoTracking()
                    join u1 in _dbContext.Users.AsNoTracking() on c.User1ID equals u1.UserID
                    join u2 in _dbContext.Users.AsNoTracking() on c.User2ID equals u2.UserID
                    where !c.IsDeleted
                    select new { c, u1, u2 };

        int totalCount = await query.CountAsync(cancellationToken);

        int safePage = System.Math.Max(1, pageNumber);
        int safeSize = System.Math.Clamp(pageSize, 1, 200);

        var items = await query
            .OrderByDescending(x => x.c.LastMessageAt)
            .Skip((safePage - 1) * safeSize)
            .Take(safeSize)
            .Select(x => new AdminConversationItem
            {
                ConversationID = x.c.ConversationID,
                User1ID = x.c.User1ID,
                User1Name = (x.u1.FirstName + " " + (x.u1.LastName ?? "")).Trim(),
                User2ID = x.c.User2ID,
                User2Name = (x.u2.FirstName + " " + (x.u2.LastName ?? "")).Trim(),
                PostID = x.c.PostID,
                LastMessageAt = x.c.LastMessageAt,
                MessageCount = _dbContext.Messages.Count(m => m.ConversationID == x.c.ConversationID && !m.IsDeleted)
            })
            .ToListAsync(cancellationToken);

        return new AdminConversationListResult
        {
            TotalCount = totalCount,
            Conversations = items
        };
    }

    public async Task<AdminConversationDetail?> GetConversationMessagesAsync(int conversationId, CancellationToken cancellationToken = default)
    {
        var conversation = await (from c in _dbContext.Conversations.AsNoTracking()
                                  join u1 in _dbContext.Users.AsNoTracking() on c.User1ID equals u1.UserID
                                  join u2 in _dbContext.Users.AsNoTracking() on c.User2ID equals u2.UserID
                                  where c.ConversationID == conversationId
                                  select new AdminConversationItem
                                  {
                                      ConversationID = c.ConversationID,
                                      User1ID = c.User1ID,
                                      User1Name = (u1.FirstName + " " + (u1.LastName ?? "")).Trim(),
                                      User2ID = c.User2ID,
                                      User2Name = (u2.FirstName + " " + (u2.LastName ?? "")).Trim(),
                                      PostID = c.PostID,
                                      LastMessageAt = c.LastMessageAt,
                                      MessageCount = 0 // filled below
                                  }).FirstOrDefaultAsync(cancellationToken);

        if (conversation == null) return null;

        var messages = await (from m in _dbContext.Messages.AsNoTracking()
                              join u in _dbContext.Users.AsNoTracking() on m.SenderID equals u.UserID
                              where m.ConversationID == conversationId && !m.IsDeleted
                              orderby m.CreatedAt
                              select new AdminMessageItem
                              {
                                  MessageID = m.MessageID,
                                  SenderID = m.SenderID,
                                  SenderName = (u.FirstName + " " + (u.LastName ?? "")).Trim(),
                                  Content = m.Content,
                                  CreatedAt = m.CreatedAt,
                                  IsRead = m.IsRead
                              }).ToListAsync(cancellationToken);

        return new AdminConversationDetail
        {
            Conversation = new AdminConversationItem
            {
                ConversationID = conversation.ConversationID,
                User1ID = conversation.User1ID,
                User1Name = conversation.User1Name,
                User2ID = conversation.User2ID,
                User2Name = conversation.User2Name,
                PostID = conversation.PostID,
                LastMessageAt = conversation.LastMessageAt,
                MessageCount = messages.Count
            },
            Messages = messages
        };
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

        _dbContext.Areas.RemoveRange(entity.Areas);
        _dbContext.Cities.Remove(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);
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
        _dbContext.Areas.Remove(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    // ── Reports ──

    private static readonly string[] _reportStatusLabels = ["Pending", "Under Review", "Resolved", "Dismissed"];

    public async Task<AdminReportListResult> GetReportsAsync(int? status = null, string? reportType = null, string? search = null, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
    {
        try
        {
            var query = _dbContext.Reports.AsNoTracking().AsQueryable();

            if (status.HasValue)
                query = query.Where(r => r.Status == status.Value);
            if (!string.IsNullOrWhiteSpace(reportType))
                query = query.Where(r => r.ReportType == reportType);

            // Build joined query for search + target label resolution (LEFT JOINs)
            var joined = from r in query
                         join reporter in _dbContext.Users.AsNoTracking() on r.ReporterUserID equals reporter.UserID
                         join resolver in _dbContext.Users.AsNoTracking() on r.ResolvedByUserID equals resolver.UserID into rg
                         from resolver in rg.DefaultIfEmpty()
                         join targetPost in _dbContext.Posts.AsNoTracking() on r.TargetID equals targetPost.PostID into tpg
                         from targetPost in tpg.DefaultIfEmpty()
                         join targetUser in _dbContext.Users.AsNoTracking() on r.TargetID equals targetUser.UserID into tug
                         from targetUser in tug.DefaultIfEmpty()
                         join targetReview in _dbContext.Reviews.AsNoTracking() on r.TargetID equals targetReview.ReviewID into trg
                         from targetReview in trg.DefaultIfEmpty()
                         select new { r, reporter, resolver, targetPost, targetUser, targetReview };

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                joined = joined.Where(x =>
                    (x.reporter.FirstName + " " + (x.reporter.LastName ?? "")).Contains(term) ||
                    x.reporter.Email.Contains(term));
            }
            int totalCount = await joined.CountAsync(cancellationToken);

            var items = await joined
                .OrderByDescending(x => x.r.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new AdminReportItem
                {
                    ReportID = x.r.ReportID,
                    ReportType = x.r.ReportType,
                    TargetID = x.r.TargetID,
                    TargetLabel =
                        x.r.ReportType == "LISTING" && x.targetPost != null
                            ? x.targetPost.PostTitle
                            : x.r.ReportType == "USER" && x.targetUser != null
                                ? (x.targetUser.FirstName + " " + (x.targetUser.LastName ?? "")).Trim()
                                : x.r.ReportType == "REVIEW" && x.targetReview != null
                                    ? x.targetReview.Comment
                                    : x.r.ReportType == "CHAT"
                                        ? "Conversation #" + x.r.TargetID
                                        : null,
                    Reason = x.r.Reason,
                    Description = x.r.Description,
                    ReporterUserID = x.r.ReporterUserID,
                    ReporterName = (x.reporter.FirstName + " " + (x.reporter.LastName ?? "")).Trim(),
                    ReporterEmail = x.reporter.Email,
                    Status = x.r.Status,
                    StatusLabel = x.r.Status >= 0 && x.r.Status < _reportStatusLabels.Length ? _reportStatusLabels[x.r.Status] : "Unknown",
                    ResolvedByUserID = x.r.ResolvedByUserID,
                    ResolvedByName = x.resolver != null ? (x.resolver.FirstName + " " + (x.resolver.LastName ?? "")).Trim() : null,
                    ResolutionNotes = x.r.ResolutionNotes,
                    CreatedAt = x.r.CreatedAt,
                    ResolvedAt = x.r.ResolvedAt
                })
                .ToListAsync(cancellationToken);

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
        var entity = await _dbContext.Reports.FindAsync([reportId], cancellationToken);
        if (entity == null) return false;

        entity.Status = newStatus;
        if (newStatus == 2 || newStatus == 3) // Resolved or Dismissed
        {
            entity.ResolvedByUserID = adminUserId;
            entity.ResolvedAt = System.DateTime.UtcNow;
        }
        if (!string.IsNullOrWhiteSpace(resolutionNotes))
            entity.ResolutionNotes = resolutionNotes;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> SuspendUserAsync(int userId, System.DateTime? suspendedUntil, int adminUserId, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserID == userId, cancellationToken);
        if (user == null) return false;

        if (suspendedUntil.HasValue)
        {
            // Timed suspension — keep Status ACTIVE but set SuspendedUntil
            user.SuspendedUntil = suspendedUntil.Value;
        }
        else
        {
            // Permanent ban
            user.Status = 2; // BANNED
            user.SuspendedUntil = null;
        }

        // Invalidate all active sessions immediately
        user.LastInvalidatedAt = System.DateTime.UtcNow;

        _dbContext.AuditActorUserId = adminUserId;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
