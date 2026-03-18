using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Api.Common.Authorization;
using TijarahJo.Api.Common.Utils;
using TijarahJo.Api.Contracts.Requests;

namespace TijarahJo.Api.Features.Admin;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/posts")]
[Authorize(Policy = AuthorizationPolicies.AdminOnly)]
public class AdminPostsController : ControllerBase
{
    private readonly IAdminQueryHandler _adminQueries;
    private readonly IPostStatusTransitionService _postStatusTransitions;

    public AdminPostsController(
        IAdminQueryHandler adminQueries,
        IPostStatusTransitionService postStatusTransitions)
    {
        _adminQueries = adminQueries;
        _postStatusTransitions = postStatusTransitions;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<AdminPostListResult>> GetAdminPosts(
        [FromQuery] int? status,
        [FromQuery] int? categoryId,
        [FromQuery] int? cityId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var filter = new AdminPostFilter
        {
            Status = status,
            CategoryId = categoryId,
            CityId = cityId
        };

        var result = await _adminQueries.GetAdminPostsAsync(filter, page, pageSize, HttpContext.RequestAborted);
        if (!result.Success || result.Result == null)
        {
            return Problem(
                statusCode: result.StatusCode,
                title: "ADMIN_POSTS_FAILED",
                detail: result.Message
            );
        }

        return Ok(result.Result);
    }

    [HttpPatch("{id}/status")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> UpdatePostStatus(int id, [FromBody] UpdatePostStatusRequest request, System.Threading.CancellationToken cancellationToken)
    {
        if (id < 1 || request == null)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Invalid request data.");
        }

        if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int currentUserId, out ActionResult? failureResult))
        {
            return failureResult!;
        }

        var result = await _postStatusTransitions.UpdateStatusAsync(
            id,
            currentUserId,
            true, // ActorIsAdmin is true since this is the Admin endpoint
            request.Status,
            cancellationToken
        );

        if (result.Success)
        {
            return Ok(new { Message = "Post status updated successfully." });
        }

        return Problem(
            statusCode: StatusCodes.Status400BadRequest,
            title: "STATUS_UPDATE_FAILED",
            detail: result.Message
        );
    }
}
