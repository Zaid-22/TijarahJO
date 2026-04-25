using Microsoft.EntityFrameworkCore;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Infrastructure.Persistence;

namespace TijarahJo.Infrastructure.Services;

/// <summary>
/// Rule-based fraud detection service. Provides auto-flagging indicators
/// for rapid account creation, duplicate listings, price anomalies, and review bombing.
/// </summary>
public sealed class FraudDetectionService(
    TijarahJoDbContext dbContext) : IFraudDetectionService
{
    private const int RapidRegistrationMinimumBurst = 10;
    private const int RapidRegistrationBaselineOffset = 5;
    private const double RapidRegistrationBaselineMultiplier = 3.0;

    public async Task<FraudSignalsResult> GetFraudSignalsAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var oneDayAgo = now.AddDays(-1);
        var oneHourAgo = now.AddHours(-1);
        var sevenDaysAgo = now.AddDays(-7);

        // 1. Rapid account creation
        var (hasRapidRegistrationSpike, recentRegistrations, rapidRegistrationThreshold, rapidRegistrationUsers) =
            await DetectRapidRegistrationsAsync(oneHourAgo, sevenDaysAgo, cancellationToken);

        // 2. Duplicate listing titles
        var (duplicateListings, duplicateListingPosts) =
            await DetectDuplicateListingsAsync(oneDayAgo, cancellationToken);

        // 3. Price anomalies
        var (suspiciousPriceCount, suspiciousPricePosts) =
            await DetectPriceAnomaliesAsync(oneDayAgo, cancellationToken);

        // 4. Review bombing
        var (reviewBombing, reviewBombingReviews) =
            await DetectReviewBombingAsync(oneDayAgo, cancellationToken);

        return new FraudSignalsResult
        {
            RapidRegistrations = hasRapidRegistrationSpike,
            RapidRegistrationCount = recentRegistrations,
            DuplicateListings = duplicateListings,
            SuspiciousPriceCount = suspiciousPriceCount,
            ReviewBombingTargets = reviewBombing,
            CheckedAt = now,
            RapidRegistrationUsers = rapidRegistrationUsers,
            DuplicateListingPosts = duplicateListingPosts,
            SuspiciousPricePosts = suspiciousPricePosts,
            ReviewBombingReviews = reviewBombingReviews,
            Signals =
            [
                new() { Type = "RAPID_REGISTRATION", Severity = hasRapidRegistrationSpike ? "HIGH" : "LOW", Count = recentRegistrations, Detail = $"{recentRegistrations} accounts created in the last hour; action threshold is {rapidRegistrationThreshold} based on recent baseline" },
                new() { Type = "DUPLICATE_LISTINGS", Severity = duplicateListings > 0 ? "MEDIUM" : "LOW", Count = duplicateListings, Detail = $"{duplicateListings} duplicate title+category groups in 24h" },
                new() { Type = "PRICE_ANOMALY", Severity = suspiciousPriceCount > 0 ? "MEDIUM" : "LOW", Count = suspiciousPriceCount, Detail = $"{suspiciousPriceCount} listings at <10% of category average" },
                new() { Type = "REVIEW_BOMBING", Severity = reviewBombing > 0 ? "HIGH" : "LOW", Count = reviewBombing, Detail = $"{reviewBombing} sellers with 5+ negative reviews in 24h" }
            ]
        };
    }

    private async Task<(bool HasSpike, int RecentCount, int Threshold, List<FraudUserCandidate> Users)>
        DetectRapidRegistrationsAsync(DateTime oneHourAgo, DateTime sevenDaysAgo, CancellationToken ct)
    {
        var recentRegistrations = await dbContext.Users
            .AsNoTracking()
            .Where(u => !u.IsDeleted && u.JoinDate >= oneHourAgo)
            .CountAsync(ct);

        var historicalRegistrations = await dbContext.Users
            .AsNoTracking()
            .Where(u => !u.IsDeleted && u.JoinDate >= sevenDaysAgo && u.JoinDate < oneHourAgo)
            .CountAsync(ct);

        var historicalWindowHours = Math.Max((oneHourAgo - sevenDaysAgo).TotalHours, 1);
        var averageRegistrationsPerHour = historicalRegistrations / historicalWindowHours;
        var threshold = Math.Max(
            RapidRegistrationMinimumBurst,
            (int)Math.Ceiling(
                (averageRegistrationsPerHour * RapidRegistrationBaselineMultiplier)
                    + RapidRegistrationBaselineOffset));
        var hasSpike = recentRegistrations >= threshold;

        var users = hasSpike
            ? await dbContext.Users
                .AsNoTracking()
                .Where(u => !u.IsDeleted && u.JoinDate >= oneHourAgo)
                .OrderByDescending(u => u.JoinDate)
                .Take(10)
                .Select(u => new FraudUserCandidate
                {
                    UserID = u.UserID,
                    Name = u.FirstName + " " + (u.LastName ?? string.Empty),
                    Email = u.Email,
                    JoinedAt = u.JoinDate,
                    Status = u.Status
                })
                .ToListAsync(ct)
            : [];

        return (hasSpike, recentRegistrations, threshold, users);
    }

    private async Task<(int Count, List<FraudPostCandidate> Posts)>
        DetectDuplicateListingsAsync(DateTime oneDayAgo, CancellationToken ct)
    {
        var duplicateListings = await dbContext.Posts
            .AsNoTracking()
            .Where(p => !p.IsDeleted && p.CreatedAt >= oneDayAgo)
            .GroupBy(p => new { p.PostTitle, p.CategoryID })
            .Where(g => g.Count() > 1)
            .CountAsync(ct);

        var duplicateKeys = await dbContext.Posts
            .AsNoTracking()
            .Where(p => !p.IsDeleted && p.CreatedAt >= oneDayAgo)
            .GroupBy(p => new { p.PostTitle, p.CategoryID })
            .Where(g => g.Count() > 1)
            .OrderByDescending(g => g.Count())
            .Take(5)
            .Select(g => new { g.Key.PostTitle, g.Key.CategoryID, Count = g.Count() })
            .ToListAsync(ct);

        var posts = new List<FraudPostCandidate>();
        foreach (var duplicate in duplicateKeys)
        {
            var items = await (
                from post in dbContext.Posts.AsNoTracking()
                join user in dbContext.Users.AsNoTracking() on post.UserID equals user.UserID
                join category in dbContext.Categories.AsNoTracking() on post.CategoryID equals category.CategoryID
                where !post.IsDeleted
                    && post.CreatedAt >= oneDayAgo
                    && post.PostTitle == duplicate.PostTitle
                    && post.CategoryID == duplicate.CategoryID
                orderby post.CreatedAt descending
                select new FraudPostCandidate
                {
                    PostID = post.PostID,
                    UserID = post.UserID,
                    Title = post.PostTitle,
                    CategoryID = post.CategoryID,
                    CategoryName = category.CategoryName,
                    SellerName = user.FirstName + " " + (user.LastName ?? string.Empty),
                    Price = post.Price,
                    Status = post.Status,
                    CreatedAt = post.CreatedAt,
                    SignalReason = duplicate.Count + " listings share this title and category"
                })
                .Take(4)
                .ToListAsync(ct);

            posts.AddRange(items);
        }

        return (duplicateListings, posts);
    }

    private async Task<(int Count, List<FraudPostCandidate> Posts)>
        DetectPriceAnomaliesAsync(DateTime oneDayAgo, CancellationToken ct)
    {
        // Single query: join recent posts against category averages, filter <10% of average
        var suspiciousQuery =
            from post in dbContext.Posts.AsNoTracking()
            join catAvg in (
                from p in dbContext.Posts.AsNoTracking()
                where !p.IsDeleted && p.Price.HasValue && p.Price > 0
                group p by p.CategoryID into g
                select new { CategoryID = g.Key, AvgPrice = g.Average(p => p.Price!.Value) }
            ) on post.CategoryID equals catAvg.CategoryID
            where !post.IsDeleted
                && post.Price.HasValue && post.Price > 0
                && post.Price < catAvg.AvgPrice * 0.1m
                && post.CreatedAt >= oneDayAgo
            select new { post, catAvg.AvgPrice };

        int suspiciousPriceCount = await suspiciousQuery.CountAsync(ct);

        // Detail query: top 10 suspicious posts with user/category info
        var posts = await (
            from item in suspiciousQuery
            join user in dbContext.Users.AsNoTracking() on item.post.UserID equals user.UserID
            join category in dbContext.Categories.AsNoTracking() on item.post.CategoryID equals category.CategoryID
            orderby item.post.CreatedAt descending
            select new FraudPostCandidate
            {
                PostID = item.post.PostID,
                UserID = item.post.UserID,
                Title = item.post.PostTitle,
                CategoryID = item.post.CategoryID,
                CategoryName = category.CategoryName,
                SellerName = user.FirstName + " " + (user.LastName ?? string.Empty),
                Price = item.post.Price,
                Status = item.post.Status,
                CreatedAt = item.post.CreatedAt,
                SignalReason = "Below 10% of category average (" + item.AvgPrice + ")"
            })
            .Take(10)
            .ToListAsync(ct);

        return (suspiciousPriceCount, posts);
    }

    private async Task<(int Count, List<FraudReviewCandidate> Reviews)>
        DetectReviewBombingAsync(DateTime oneDayAgo, CancellationToken ct)
    {
        // Base filter for negative reviews in last 24h
        var negativeReviews = dbContext.Reviews
            .AsNoTracking()
            .Where(r => !r.IsDeleted && r.CreatedAt >= oneDayAgo && r.Rating <= 2);

        // Count sellers with 5+ negative reviews
        var reviewBombing = await negativeReviews
            .GroupBy(r => r.ReviewedUserID)
            .Where(g => g.Count() >= 5)
            .CountAsync(ct);

        // Get target seller IDs (top 5 by volume)
        var targetUserIds = await negativeReviews
            .GroupBy(r => r.ReviewedUserID)
            .Where(g => g.Count() >= 5)
            .OrderByDescending(g => g.Count())
            .Take(5)
            .Select(g => g.Key)
            .ToListAsync(ct);

        // Single query: get all review details for those targets
        var reviews = targetUserIds.Count > 0
            ? await (
                from review in negativeReviews
                join reviewer in dbContext.Users.AsNoTracking() on review.ReviewerID equals reviewer.UserID
                join reviewed in dbContext.Users.AsNoTracking() on review.ReviewedUserID equals reviewed.UserID
                where targetUserIds.Contains(review.ReviewedUserID)
                orderby review.ReviewedUserID, review.CreatedAt descending
                select new FraudReviewCandidate
                {
                    ReviewID = review.ReviewID,
                    ReviewerID = review.ReviewerID,
                    ReviewerName = reviewer.FirstName + " " + (reviewer.LastName ?? string.Empty),
                    ReviewedUserID = review.ReviewedUserID,
                    ReviewedUserName = reviewed.FirstName + " " + (reviewed.LastName ?? string.Empty),
                    Rating = review.Rating,
                    Comment = review.Comment,
                    CreatedAt = review.CreatedAt,
                    SignalReason = "Negative review bombing target (24h)"
                })
                .Take(25) // 5 targets × 5 reviews max
                .ToListAsync(ct)
            : [];

        return (reviewBombing, reviews);
    }
}
