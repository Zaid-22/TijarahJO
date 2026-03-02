using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDBAPI.Common.Authorization;

namespace TijarahJoDBAPI.Features.Admin;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/audit-logs")]
[Authorize(Policy = AuthorizationPolicies.AdminOnly)]
public class AdminAuditLogController : ControllerBase
{
    private readonly IAdminQueryHandler _adminQueries;

    public AdminAuditLogController(IAdminQueryHandler adminQueries)
    {
        _adminQueries = adminQueries;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> GetAuditLogs(
        [FromQuery] string? tableName,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var result = await _adminQueries.GetAuditLogsAsync(tableName, page, pageSize, HttpContext.RequestAborted);
        if (!result.Success || result.Result == null)
        {
            return Problem(
                statusCode: result.StatusCode,
                title: "AUDIT_LOGS_FAILED",
                detail: result.Message
            );
        }

        return Ok(result.Result);
    }
}
