using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Api.Common.Authorization;

namespace TijarahJo.Api.Features.Admin;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin")]
[Authorize(Policy = AuthorizationPolicies.AdminOnly)]
public class AdminDashboardController : ControllerBase
{
    private readonly IAdminQueryHandler _adminQueries;

    public AdminDashboardController(IAdminQueryHandler adminQueries)
    {
        _adminQueries = adminQueries;
    }

    [HttpGet("stats")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<DashboardStatsResponse>> GetDashboardStats()
    {
        var result = await _adminQueries.GetDashboardStatsAsync(HttpContext.RequestAborted);
        if (!result.Success || result.Stats == null)
        {
            return Problem(
                statusCode: result.StatusCode,
                title: "ADMIN_STATS_FAILED",
                detail: result.Message
            );
        }

        return Ok(result.Stats);
    }
}
