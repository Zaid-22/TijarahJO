using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TijarahJoDB.Application.Abstractions.DataAccess;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDBAPI.Common.Authorization;

namespace TijarahJoDBAPI.Features.Admin;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/users")]
[Authorize(Policy = AuthorizationPolicies.AdminOnly)]
public class AdminUsersController : ControllerBase
{
    private readonly IAdminQueryHandler _adminQueries;

    public AdminUsersController(IAdminQueryHandler adminQueries)
    {
        _adminQueries = adminQueries;
    }

    [HttpGet("{id}/details")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<AdminUserDetails>> GetAdminUserDetails(int id)
    {
        var result = await _adminQueries.GetAdminUserDetailsAsync(id, HttpContext.RequestAborted);
        if (!result.Success || result.Result == null)
        {
            return Problem(
                statusCode: result.StatusCode,
                title: "ADMIN_USER_DETAILS_FAILED",
                detail: result.Message
            );
        }

        return Ok(result.Result);
    }
}
