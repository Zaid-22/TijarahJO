using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Domain.Entities;
using TijarahJo.Infrastructure.Persistence;

namespace TijarahJo.Infrastructure.Services;

/// <summary>
/// Core data hygiene engine — detects cold/stale/orphaned data, classifies findings,
/// and executes safe cleanup with full audit trail.
/// </summary>
public sealed class DataHygieneService(
    IServiceScopeFactory scopeFactory,
    ILogger<DataHygieneService> logger) : IDataHygieneService
{
    private const int BatchSize = 1000;
    private const double ThresholdPercent = 0.05; // 5% safety threshold

    private readonly IServiceScopeFactory _scopeFactory = scopeFactory;
    private readonly ILogger<DataHygieneService> _logger = logger;

    // ── Public API ──────────────────────────────────────────────────────

    public async Task<DataHygieneReport> RunDiagnosticScanAsync(
        bool forceFullScan = false,
        CancellationToken ct = default)
    {
        var cycleId = Guid.NewGuid();
        var utcNow = DateTime.UtcNow;
        var findings = new List<DataHygieneLogEntity>();

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation("Data hygiene scan {CycleID} starting...", cycleId);
        }

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TijarahJoDbContext>();

        bool isOffPeak = forceFullScan || (utcNow.Hour >= 2 && utcNow.Hour < 5);

        // ── Phase 1: Detection ──────────────────────────────────────

        // Scan 1: Expired BlacklistedTokens (always run)
        int expiredTokens = await db.BlacklistedTokens
            .Where(t => t.ExpiresAt <= utcNow)
            .CountAsync(ct);

        if (expiredTokens > 0)
            findings.Add(CreateFinding(cycleId, utcNow, "BlacklistedTokens", "COLD_DATA",
                "SAFE_TO_DELETE", expiredTokens, "Expired JWT tokens past their expiry date"));

        // Scan 2: Expired VerificationChallenges (always run)
        int expiredChallenges = await db.VerificationChallenges
            .Where(vc => vc.ExpiresAt < utcNow)
            .CountAsync(ct);

        if (expiredChallenges > 0)
            findings.Add(CreateFinding(cycleId, utcNow, "VerificationChallenges", "COLD_DATA",
                "SAFE_TO_DELETE", expiredChallenges, "Expired 2FA/password-reset challenges"));

        // Scan 3: Inactive PushSubscriptions >90 days (always run)
        var pushCutoff = utcNow.AddDays(-90);
        int deadPushSubs = await db.PushSubscriptions
            .Where(ps => !ps.IsActive && ps.UpdatedAt < pushCutoff)
            .CountAsync(ct);

        if (deadPushSubs > 0)
            findings.Add(CreateFinding(cycleId, utcNow, "PushSubscriptions", "STALE",
                "SAFE_TO_DELETE", deadPushSubs, "Inactive push endpoints deactivated >90 days ago"));

        // Scan 4: Stale read Notifications >30 days (always run)
        var notifCutoff = utcNow.AddDays(-30);
        int staleNotifs = await db.Notifications
            .IgnoreQueryFilters()
            .Where(n => n.IsRead && n.ReadAt != null && n.ReadAt < notifCutoff && !n.IsDeleted)
            .CountAsync(ct);

        if (staleNotifs > 0)
            findings.Add(CreateFinding(cycleId, utcNow, "Notifications", "STALE",
                "SAFE_TO_DELETE", staleNotifs, "Read notifications older than 30 days"));

        // Heavy scans — only during off-peak or forced
        if (isOffPeak)
        {
            // Scan 5: Orphaned PostImages (parent Post soft-deleted)
            int orphanedImages = await db.PostImages
                .IgnoreQueryFilters()
                .Where(pi => !pi.IsDeleted)
                .Join(db.Posts.IgnoreQueryFilters().Where(p => p.IsDeleted),
                    pi => pi.PostID, p => p.PostID, (pi, _) => pi)
                .CountAsync(ct);

            if (orphanedImages > 0)
                findings.Add(CreateFinding(cycleId, utcNow, "PostImages", "ORPHAN",
                    "SAFE_TO_DELETE", orphanedImages, "Images whose parent Post is soft-deleted"));

            // Scan 6: Orphaned Favorites (parent Post soft-deleted)
            int orphanedFavs = await db.Favorites
                .IgnoreQueryFilters()
                .Where(f => !f.IsDeleted)
                .Join(db.Posts.IgnoreQueryFilters().Where(p => p.IsDeleted),
                    f => f.PostID, p => p.PostID, (f, _) => f)
                .CountAsync(ct);

            if (orphanedFavs > 0)
                findings.Add(CreateFinding(cycleId, utcNow, "Favorites", "ORPHAN",
                    "SAFE_TO_DELETE", orphanedFavs, "Favorites whose parent Post is soft-deleted"));

            // Scan 7: AuditLog entries >6 months
            var auditCutoff = utcNow.AddMonths(-6);
            int staleAuditRows = await db.AuditLogs
                .Where(a => a.ChangedAt < auditCutoff)
                .CountAsync(ct);

            if (staleAuditRows > 0)
                findings.Add(CreateFinding(cycleId, utcNow, "AuditLog", "STALE",
                    "ARCHIVE", staleAuditRows, "Audit entries older than 6 months"));

            // Scan 8: Table health profile (soft-deleted percentage)
            await ScanTableHealthAsync(db, cycleId, utcNow, findings, ct);
        }

        // Apply 5% threshold — reclassify large findings
        foreach (var finding in findings)
        {
            if (finding.Classification == "SAFE_TO_DELETE" || finding.Classification == "ARCHIVE")
            {
                int totalRows = await GetTableRowCountAsync(db, finding.TableName, ct);
                if (totalRows > 0 && (double)finding.AffectedRowCount / totalRows > ThresholdPercent)
                {
                    finding.Classification = "REQUIRES_REVIEW";
                    finding.Notes += $" [THRESHOLD: {finding.AffectedRowCount}/{totalRows} = " +
                                     $"{(double)finding.AffectedRowCount / totalRows:P1} > 5%]";
                }
            }
        }

        // Persist all findings (Phase 1)
        if (findings.Count > 0)
        {
            db.DataHygieneLogs.AddRange(findings);
            await db.SaveChangesAsync(ct);
        }

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Data hygiene scan {CycleID} detected {Count} findings across {Tables} tables",
                cycleId, findings.Count,
                findings.Select(f => f.TableName).Distinct().Count());
        }

        // ── Phase 2: Auto-execute SAFE_TO_DELETE ────────────────────

        int autoExecuted = 0;
        int totalRowsAffected = 0;

        foreach (var finding in findings.Where(f => f.Classification == "SAFE_TO_DELETE"))
        {
            int affected = await ExecuteCleanupAsync(db, finding, ct);
            if (affected > 0)
            {
                finding.Phase = 2;
                finding.ActionTaken = finding.FindingType == "ORPHAN" ? "SOFT_DELETED" : "HARD_DELETED";
                finding.ActionedAt = DateTime.UtcNow;
                autoExecuted++;
                totalRowsAffected += affected;
            }
        }

        if (autoExecuted > 0)
        {
            await db.SaveChangesAsync(ct);
        }

        // ── Self-cleanup: purge own logs >90 days ───────────────────

        var logRetention = utcNow.AddDays(-90);
        int purgedLogs = await db.DataHygieneLogs
            .Where(l => l.DetectedAt < logRetention)
            .ExecuteDeleteAsync(ct);

        if (purgedLogs > 0 && _logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation("Self-cleaned {Count} DataHygieneLog entries older than 90 days", purgedLogs);
        }

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Data hygiene scan {CycleID} complete. Findings: {Total}, Auto-executed: {Executed}, " +
                "Pending review: {Pending}, Rows affected: {Rows}",
                cycleId, findings.Count, autoExecuted,
                findings.Count(f => f.Classification == "REQUIRES_REVIEW"),
                totalRowsAffected);
        }

        return BuildReport(cycleId, findings, autoExecuted, totalRowsAffected);
    }

    public async Task<DataHygieneReport?> GetLatestReportAsync(CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TijarahJoDbContext>();

        var latestCycleId = await db.DataHygieneLogs
            .OrderByDescending(l => l.DetectedAt)
            .Select(l => (Guid?)l.CycleID)
            .FirstOrDefaultAsync(ct);

        if (latestCycleId == null) return null;

        var findings = await db.DataHygieneLogs
            .Where(l => l.CycleID == latestCycleId.Value)
            .OrderBy(l => l.TableName)
            .ToListAsync(ct);

        return BuildReport(
            latestCycleId.Value,
            findings,
            findings.Count(f => f.ActionTaken != "NONE" && f.ActionTaken != "SKIPPED"),
            findings.Where(f => f.ActionTaken != "NONE").Sum(f => f.AffectedRowCount));
    }

    public async Task<DataHygieneHistoryResult> GetHygieneHistoryAsync(
        int page = 1, int pageSize = 50, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TijarahJoDbContext>();

        int safePage = Math.Max(1, page);
        int safeSize = Math.Clamp(pageSize, 1, 100);

        int totalCount = await db.DataHygieneLogs.CountAsync(ct);

        var entries = await db.DataHygieneLogs
            .OrderByDescending(l => l.DetectedAt)
            .Skip((safePage - 1) * safeSize)
            .Take(safeSize)
            .Select(l => new DataHygieneFinding
            {
                HygieneLogID = l.HygieneLogID,
                TableName = l.TableName,
                FindingType = l.FindingType,
                Classification = l.Classification,
                AffectedRowCount = l.AffectedRowCount,
                Phase = l.Phase,
                ActionTaken = l.ActionTaken,
                Notes = l.Notes
            })
            .ToListAsync(ct);

        return new DataHygieneHistoryResult { TotalCount = totalCount, Entries = entries };
    }

    public async Task<int> ApproveAndExecuteAsync(Guid cycleId, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TijarahJoDbContext>();

        var pendingFindings = await db.DataHygieneLogs
            .Where(l => l.CycleID == cycleId
                     && l.Classification == "REQUIRES_REVIEW"
                     && l.Phase == 1)
            .ToListAsync(ct);

        int totalExecuted = 0;

        foreach (var finding in pendingFindings)
        {
            int affected = await ExecuteCleanupAsync(db, finding, ct);
            finding.Phase = 2;
            finding.ActionTaken = affected > 0
                ? (finding.FindingType == "ORPHAN" ? "SOFT_DELETED" : "HARD_DELETED")
                : "SKIPPED";
            finding.ActionedAt = DateTime.UtcNow;
            finding.Notes += " [APPROVED BY ADMIN]";
            totalExecuted += affected;
        }

        if (pendingFindings.Count > 0)
            await db.SaveChangesAsync(ct);

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Admin approved cycle {CycleID}: {Count} findings executed, {Rows} rows affected",
                cycleId, pendingFindings.Count, totalExecuted);
        }

        return totalExecuted;
    }

    // ── Private helpers ─────────────────────────────────────────────

    private async Task<int> ExecuteCleanupAsync(
        TijarahJoDbContext db, DataHygieneLogEntity finding, CancellationToken ct)
    {
        try
        {
            return finding.TableName switch
            {
                "BlacklistedTokens" => await PurgeInBatchesAsync(
                    () => db.BlacklistedTokens
                        .Where(t => t.ExpiresAt <= DateTime.UtcNow)
                        .Take(BatchSize)
                        .ExecuteDeleteAsync(ct), ct),

                "VerificationChallenges" => await PurgeInBatchesAsync(
                    () => db.VerificationChallenges
                        .Where(vc => vc.ExpiresAt < DateTime.UtcNow)
                        .Take(BatchSize)
                        .ExecuteDeleteAsync(ct), ct),

                "PushSubscriptions" => await PurgeInBatchesAsync(
                    () => db.PushSubscriptions
                        .Where(ps => !ps.IsActive && ps.UpdatedAt < DateTime.UtcNow.AddDays(-90))
                        .Take(BatchSize)
                        .ExecuteDeleteAsync(ct), ct),

                "Notifications" => await db.Notifications
                    .IgnoreQueryFilters()
                    .Where(n => n.IsRead && n.ReadAt != null
                             && n.ReadAt < DateTime.UtcNow.AddDays(-30)
                             && !n.IsDeleted)
                    .ExecuteUpdateAsync(
                        s => s.SetProperty(n => n.IsDeleted, true), ct),

                "PostImages" => await db.PostImages
                    .IgnoreQueryFilters()
                    .Where(pi => !pi.IsDeleted)
                    .Join(db.Posts.IgnoreQueryFilters().Where(p => p.IsDeleted),
                        pi => pi.PostID, p => p.PostID, (pi, _) => pi)
                    .ExecuteUpdateAsync(
                        s => s.SetProperty(pi => pi.IsDeleted, true), ct),

                "Favorites" => await db.Favorites
                    .IgnoreQueryFilters()
                    .Where(f => !f.IsDeleted)
                    .Join(db.Posts.IgnoreQueryFilters().Where(p => p.IsDeleted),
                        f => f.PostID, p => p.PostID, (f, _) => f)
                    .ExecuteUpdateAsync(
                        s => s.SetProperty(f => f.IsDeleted, true), ct),

                _ => 0
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to execute cleanup for {Table}/{Type}",
                finding.TableName, finding.FindingType);
            finding.Notes += $" [ERROR: {ex.Message}]";
            return 0;
        }
    }

    private static async Task ScanTableHealthAsync(
        TijarahJoDbContext db, Guid cycleId, DateTime utcNow,
        List<DataHygieneLogEntity> findings, CancellationToken ct)
    {
        var tables = new (string Name, Func<Task<int>> Total, Func<Task<int>> Deleted)[]
        {
            ("Posts",
                () => db.Posts.IgnoreQueryFilters().CountAsync(ct),
                () => db.Posts.IgnoreQueryFilters().CountAsync(p => p.IsDeleted, ct)),
            ("PostImages",
                () => db.PostImages.IgnoreQueryFilters().CountAsync(ct),
                () => db.PostImages.IgnoreQueryFilters().CountAsync(pi => pi.IsDeleted, ct)),
            ("Favorites",
                () => db.Favorites.IgnoreQueryFilters().CountAsync(ct),
                () => db.Favorites.IgnoreQueryFilters().CountAsync(f => f.IsDeleted, ct)),
            ("Messages",
                () => db.Messages.IgnoreQueryFilters().CountAsync(ct),
                () => db.Messages.IgnoreQueryFilters().CountAsync(m => m.IsDeleted, ct)),
            ("Reviews",
                () => db.Reviews.IgnoreQueryFilters().CountAsync(ct),
                () => db.Reviews.IgnoreQueryFilters().CountAsync(r => r.IsDeleted, ct)),
            ("Notifications",
                () => db.Notifications.IgnoreQueryFilters().CountAsync(ct),
                () => db.Notifications.IgnoreQueryFilters().CountAsync(n => n.IsDeleted, ct)),
        };

        foreach (var (name, getTotal, getDeleted) in tables)
        {
            int total = await getTotal();
            int deleted = await getDeleted();
            double deletedPct = total > 0 ? (double)deleted / total : 0;

            findings.Add(CreateFinding(cycleId, utcNow, name, "TABLE_HEALTH", "INFO", total,
                $"Total: {total}, Soft-deleted: {deleted} ({deletedPct:P1}), Active: {total - deleted}"));
        }
    }

    private static async Task<int> GetTableRowCountAsync(
        TijarahJoDbContext db, string tableName, CancellationToken ct)
    {
        return tableName switch
        {
            "BlacklistedTokens" => await db.BlacklistedTokens.CountAsync(ct),
            "VerificationChallenges" => await db.VerificationChallenges.CountAsync(ct),
            "PushSubscriptions" => await db.PushSubscriptions.CountAsync(ct),
            "Notifications" => await db.Notifications.IgnoreQueryFilters().CountAsync(ct),
            "PostImages" => await db.PostImages.IgnoreQueryFilters().CountAsync(ct),
            "Favorites" => await db.Favorites.IgnoreQueryFilters().CountAsync(ct),
            "AuditLog" => await db.AuditLogs.CountAsync(ct),
            _ => 0
        };
    }

    private static async Task<int> PurgeInBatchesAsync(
        Func<Task<int>> deleteBatch, CancellationToken ct)
    {
        int totalDeleted = 0;
        int deleted;
        do
        {
            ct.ThrowIfCancellationRequested();
            deleted = await deleteBatch();
            totalDeleted += deleted;
        } while (deleted >= BatchSize);
        return totalDeleted;
    }

    private static DataHygieneLogEntity CreateFinding(
        Guid cycleId, DateTime utcNow, string table, string findingType,
        string classification, int rowCount, string notes) => new()
    {
        CycleID = cycleId,
        TableName = table,
        FindingType = findingType,
        Classification = classification,
        AffectedRowCount = rowCount,
        Phase = 1,
        ActionTaken = "NONE",
        DetectedAt = utcNow,
        Notes = notes
    };

    private static DataHygieneReport BuildReport(
        Guid cycleId, List<DataHygieneLogEntity> findings,
        int autoExecuted, int totalRowsAffected) => new()
    {
        CycleID = cycleId,
        ScannedAt = findings.FirstOrDefault()?.DetectedAt ?? DateTime.UtcNow,
        TotalFindings = findings.Count,
        AutoExecuted = autoExecuted,
        PendingReview = findings.Count(f => f.Classification == "REQUIRES_REVIEW" && f.Phase == 1),
        TotalRowsAffected = totalRowsAffected,
        Findings = [.. findings.Select(f => new DataHygieneFinding
        {
            HygieneLogID = f.HygieneLogID,
            TableName = f.TableName,
            FindingType = f.FindingType,
            Classification = f.Classification,
            AffectedRowCount = f.AffectedRowCount,
            Phase = f.Phase,
            ActionTaken = f.ActionTaken,
            Notes = f.Notes
        })]
    };
}
