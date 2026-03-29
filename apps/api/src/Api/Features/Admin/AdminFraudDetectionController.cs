using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TijarahJo.Infrastructure.Persistence;
using TijarahJo.Api.Common.Authorization;

namespace TijarahJo.Api.Features.Admin;

/// <summary>
/// Admin endpoint for fraud detection signals.
/// Provides rule-based auto-flagging indicators.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/fraud")]
[Authorize(Policy = AuthorizationPolicies.FraudView)]
public class AdminFraudDetectionController : ControllerBase
{
    private readonly TijarahJoDbContext _dbContext;

    public AdminFraudDetectionController(TijarahJoDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <summary>
    /// Returns fraud detection signals based on rule-based checks.
    /// </summary>
    [HttpGet("signals")]
    public async Task<ActionResult> GetFraudSignals()
    {
        var now = DateTime.UtcNow;
        var oneDayAgo = now.AddDays(-1);
        var oneHourAgo = now.AddHours(-1);

        // 1. Rapid account creation (5+ accounts in 1 hour)
        var recentRegistrations = await _dbContext.Users
            .AsNoTracking()
            .Where(u => !u.IsDeleted && u.JoinDate >= oneHourAgo)
            .CountAsync(HttpContext.RequestAborted);

        // 2. Duplicate listing titles (same title + category in 24h)
        var duplicateListings = await _dbContext.Posts
            .AsNoTracking()
            .Where(p => !p.IsDeleted && p.CreatedAt >= oneDayAgo)
            .GroupBy(p => new { p.PostTitle, p.CategoryID })
            .Where(g => g.Count() > 1)
            .CountAsync(HttpContext.RequestAborted);

        // 3. Price anomalies (listings at <10% of category average)
        var categoryAverages = await _dbContext.Posts
            .AsNoTracking()
            .Where(p => !p.IsDeleted && p.Price.HasValue && p.Price > 0)
            .GroupBy(p => p.CategoryID)
            .Select(g => new { CategoryID = g.Key, AvgPrice = g.Average(p => p.Price!.Value) })
            .ToListAsync(HttpContext.RequestAborted);

        int suspiciousPriceCount = 0;
        foreach (var cat in categoryAverages)
        {
            var threshold = cat.AvgPrice * 0.1m;
            var count = await _dbContext.Posts
                .AsNoTracking()
                .Where(p => !p.IsDeleted && p.CategoryID == cat.CategoryID
                    && p.Price.HasValue && p.Price > 0 && p.Price < threshold
                    && p.CreatedAt >= oneDayAgo)
                .CountAsync(HttpContext.RequestAborted);
            suspiciousPriceCount += count;
        }

        // 4. Review bombing (5+ negative reviews on one seller in 24h)
        var reviewBombing = await _dbContext.Reviews
            .AsNoTracking()
            .Where(r => !r.IsDeleted && r.CreatedAt >= oneDayAgo && r.Rating <= 2)
            .GroupBy(r => r.ReviewedUserID)
            .Where(g => g.Count() >= 5)
            .CountAsync(HttpContext.RequestAborted);

        return Ok(new FraudSignalsResult
        {
            RapidRegistrations = recentRegistrations >= 5,
            RapidRegistrationCount = recentRegistrations,
            DuplicateListings = duplicateListings,
            SuspiciousPriceCount = suspiciousPriceCount,
            ReviewBombingTargets = reviewBombing,
            CheckedAt = now,
            Signals = new List<FraudSignal>
            {
                new() { Type = "RAPID_REGISTRATION", Severity = recentRegistrations >= 5 ? "HIGH" : "LOW", Count = recentRegistrations, Detail = $"{recentRegistrations} accounts created in the last hour" },
                new() { Type = "DUPLICATE_LISTINGS", Severity = duplicateListings > 0 ? "MEDIUM" : "LOW", Count = duplicateListings, Detail = $"{duplicateListings} duplicate title+category groups in 24h" },
                new() { Type = "PRICE_ANOMALY", Severity = suspiciousPriceCount > 0 ? "MEDIUM" : "LOW", Count = suspiciousPriceCount, Detail = $"{suspiciousPriceCount} listings at <10% of category average" },
                new() { Type = "REVIEW_BOMBING", Severity = reviewBombing > 0 ? "HIGH" : "LOW", Count = reviewBombing, Detail = $"{reviewBombing} sellers with 5+ negative reviews in 24h" }
            }
        });
    }
}

public sealed class FraudSignalsResult
{
    public bool RapidRegistrations { get; set; }
    public int RapidRegistrationCount { get; set; }
    public int DuplicateListings { get; set; }
    public int SuspiciousPriceCount { get; set; }
    public int ReviewBombingTargets { get; set; }
    public DateTime CheckedAt { get; set; }
    public List<FraudSignal> Signals { get; set; } = new();
}

public sealed class FraudSignal
{
    public string Type { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public int Count { get; set; }
    public string Detail { get; set; } = string.Empty;
}
