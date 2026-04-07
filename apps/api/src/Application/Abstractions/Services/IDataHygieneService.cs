namespace TijarahJo.Application.Abstractions.Services;

/// <summary>
/// Automated data hygiene detection and lifecycle management service.
/// </summary>
public interface IDataHygieneService
{
    /// <summary>
    /// Runs a full diagnostic scan across all tables, logs findings to DataHygieneLog,
    /// and auto-executes SAFE_TO_DELETE items.
    /// </summary>
    Task<DataHygieneReport> RunDiagnosticScanAsync(bool forceFullScan = false, CancellationToken ct = default);

    /// <summary>Returns the most recent scan cycle report.</summary>
    Task<DataHygieneReport?> GetLatestReportAsync(CancellationToken ct = default);

    /// <summary>Returns paginated history of all hygiene log entries.</summary>
    Task<DataHygieneHistoryResult> GetHygieneHistoryAsync(int page = 1, int pageSize = 50, CancellationToken ct = default);

    /// <summary>
    /// Approves and executes all REQUIRES_REVIEW findings for a given cycle.
    /// </summary>
    Task<int> ApproveAndExecuteAsync(Guid cycleId, CancellationToken ct = default);
}

/// <summary>Summary of a single diagnostic scan cycle.</summary>
public sealed class DataHygieneReport
{
    public Guid CycleID { get; set; }
    public DateTime ScannedAt { get; set; }
    public int TotalFindings { get; set; }
    public int AutoExecuted { get; set; }
    public int PendingReview { get; set; }
    public int TotalRowsAffected { get; set; }
    public IReadOnlyList<DataHygieneFinding> Findings { get; set; } = [];
}

/// <summary>A single finding from a scan.</summary>
public sealed class DataHygieneFinding
{
    public long HygieneLogID { get; set; }
    public string TableName { get; set; } = string.Empty;
    public string FindingType { get; set; } = string.Empty;
    public string Classification { get; set; } = string.Empty;
    public int AffectedRowCount { get; set; }
    public int Phase { get; set; }
    public string ActionTaken { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

/// <summary>Paginated history result.</summary>
public sealed class DataHygieneHistoryResult
{
    public int TotalCount { get; set; }
    public IReadOnlyList<DataHygieneFinding> Entries { get; set; } = [];
}
