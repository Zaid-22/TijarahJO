using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Api.Common.Authorization;

namespace TijarahJo.Api.Features.Admin;

/// <summary>
/// Admin endpoints for monitoring and managing automated data hygiene.
/// All endpoints require admin access.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/data-hygiene")]
[Authorize(Policy = AuthorizationPolicies.AdminAccess)]
public class AdminDataHygieneController(IDataHygieneService hygieneService) : ControllerBase
{
    private readonly IDataHygieneService _hygieneService = hygieneService;

    /// <summary>
    /// Returns the latest diagnostic scan report with all findings and their status.
    /// </summary>
    [HttpGet("report")]
    [ProducesResponseType(typeof(DataHygieneReport), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetLatestReport()
    {
        var report = await _hygieneService.GetLatestReportAsync(HttpContext.RequestAborted);
        if (report == null)
            return NotFound(new { message = "No hygiene scan has been run yet." });

        return Ok(report);
    }

    /// <summary>
    /// Returns paginated history of all hygiene log entries.
    /// </summary>
    [HttpGet("history")]
    [ProducesResponseType(typeof(DataHygieneHistoryResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHistory(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var result = await _hygieneService.GetHygieneHistoryAsync(page, pageSize, HttpContext.RequestAborted);
        return Ok(result);
    }

    /// <summary>
    /// Triggers a manual diagnostic scan (bypasses off-peak window).
    /// Use this to see current database health without waiting for the next scheduled cycle.
    /// </summary>
    [HttpPost("scan")]
    [ProducesResponseType(typeof(DataHygieneReport), StatusCodes.Status200OK)]
    public async Task<IActionResult> TriggerManualScan()
    {
        var report = await _hygieneService.RunDiagnosticScanAsync(
            forceFullScan: true,
            HttpContext.RequestAborted);

        return Ok(report);
    }

    /// <summary>
    /// Approves and executes all REQUIRES_REVIEW findings for a given scan cycle.
    /// Use this after reviewing the report to confirm cleanup of items that exceeded the 5% threshold.
    /// </summary>
    [HttpPost("approve/{cycleId:guid}")]
    [ProducesResponseType(typeof(ApproveResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApproveAndExecute(Guid cycleId)
    {
        int rowsAffected = await _hygieneService.ApproveAndExecuteAsync(
            cycleId,
            HttpContext.RequestAborted);

        return Ok(new ApproveResult
        {
            CycleID = cycleId,
            RowsAffected = rowsAffected,
            Message = rowsAffected > 0
                ? $"Successfully executed cleanup: {rowsAffected} rows affected."
                : "No pending items found for this cycle."
        });
    }
}

/// <summary>Result of an admin approval action.</summary>
public sealed class ApproveResult
{
    public Guid CycleID { get; set; }
    public int RowsAffected { get; set; }
    public string Message { get; set; } = string.Empty;
}
