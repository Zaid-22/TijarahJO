namespace TijarahJo.Domain.Entities;

/// <summary>
/// Tracks every data hygiene scan finding and cleanup action.
/// Written by <see cref="TijarahJo.Infrastructure.Services.DataHygieneService"/>
/// during periodic diagnostic scans.
/// </summary>
public sealed class DataHygieneLogEntity
{
    public long HygieneLogID { get; set; }

    /// <summary>Groups all findings from a single scan cycle.</summary>
    public Guid CycleID { get; set; }

    /// <summary>Name of the affected table, e.g. "BlacklistedTokens".</summary>
    public string TableName { get; set; } = string.Empty;

    /// <summary>"COLD_DATA", "ORPHAN", "STALE", "OVERSIZED", "TABLE_HEALTH".</summary>
    public string FindingType { get; set; } = string.Empty;

    /// <summary>"SAFE_TO_DELETE", "ARCHIVE", "REQUIRES_REVIEW", "INFO".</summary>
    public string Classification { get; set; } = string.Empty;

    /// <summary>Number of rows affected by this finding.</summary>
    public int AffectedRowCount { get; set; }

    /// <summary>JSON array of up to 5 sample primary keys for audit reference.</summary>
    public string? SampleData { get; set; }

    /// <summary>1 = Detected, 2 = Soft-Deleted/Archived, 3 = Purged.</summary>
    public int Phase { get; set; } = 1;

    /// <summary>"NONE", "SOFT_DELETED", "HARD_DELETED", "ARCHIVED", "SKIPPED".</summary>
    public string ActionTaken { get; set; } = "NONE";

    /// <summary>When the finding was first detected.</summary>
    public DateTime DetectedAt { get; set; }

    /// <summary>When the cleanup action was executed (null if Phase 1 only).</summary>
    public DateTime? ActionedAt { get; set; }

    /// <summary>Optional notes — reason for skipping, error details, etc.</summary>
    public string? Notes { get; set; }
}
