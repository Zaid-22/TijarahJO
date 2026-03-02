using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TijarahJoDB.Application.Abstractions.DataAccess;
using TijarahJoDBAPI.Common.Authorization;
using System.Security.Claims;

namespace TijarahJoDBAPI.Features.Admin;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/reports")]
[Authorize(Policy = AuthorizationPolicies.AdminOnly)]
public class AdminReportsQueueController : ControllerBase
{
    private readonly IAdminDataAccess _adminDataAccess;

    public AdminReportsQueueController(IAdminDataAccess adminDataAccess)
    {
        _adminDataAccess = adminDataAccess;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> GetReports(
        [FromQuery] int? status = null,
        [FromQuery] string? reportType = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var result = await _adminDataAccess.GetReportsAsync(status, reportType, page, pageSize, HttpContext.RequestAborted);
        return Ok(result);
    }

    [HttpPut("{id}/status")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> UpdateReportStatus(int id, [FromBody] UpdateReportStatusRequest request)
    {
        var adminUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

        bool updated = await _adminDataAccess.UpdateReportStatusAsync(
            id,
            request.Status,
            adminUserId,
            request.ResolutionNotes,
            HttpContext.RequestAborted);

        if (!updated) return NotFound();
        return Ok(new { Message = "Report status updated." });
    }
}

public sealed class UpdateReportStatusRequest
{
    public int Status { get; set; }
    public string? ResolutionNotes { get; set; }
}
