using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDBAPI.Common.Authorization;
using TijarahJoDBAPI.Common.Utils;

namespace TijarahJoDBAPI.Features.Admin;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/reviews")]
[Authorize(Policy = AuthorizationPolicies.AdminOnly)]
public class AdminReviewsController : ControllerBase
{
    private readonly IAdminQueryHandler _adminQueries;

    public AdminReviewsController(IAdminQueryHandler adminQueries)
    {
        _adminQueries = adminQueries;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> GetAdminReviews(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var result = await _adminQueries.GetAdminReviewsAsync(page, pageSize, HttpContext.RequestAborted);
        if (!result.Success || result.Result == null)
        {
            return Problem(
                statusCode: result.StatusCode,
                title: "ADMIN_REVIEWS_FAILED",
                detail: result.Message
            );
        }

        return Ok(result.Result);
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteReview(int id, System.Threading.CancellationToken cancellationToken)
    {
        if (id < 1)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Invalid review ID.");
        }

        if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int currentUserId, out ActionResult? failureResult))
        {
            return failureResult!;
        }

        var result = await _adminQueries.SoftDeleteReviewAsync(id, currentUserId, cancellationToken);
        if (result.Success)
        {
            return Ok(new { Message = result.Message });
        }

        return Problem(
            statusCode: result.StatusCode,
            title: "REVIEW_DELETE_FAILED",
            detail: result.Message
        );
    }
}
