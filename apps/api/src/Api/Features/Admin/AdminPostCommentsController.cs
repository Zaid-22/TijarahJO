using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Api.Common.Authorization;
using TijarahJo.Api.Common.Utils;

namespace TijarahJo.Api.Features.Admin;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/post-comments")]
public class AdminPostCommentsController : ControllerBase
{
    private readonly IAdminQueryHandler _adminQueries;

    public AdminPostCommentsController(IAdminQueryHandler adminQueries)
    {
        _adminQueries = adminQueries;
    }

    [HttpGet]
    [Authorize(Policy = AuthorizationPolicies.CommentsView)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> GetAdminPostComments(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null)
    {
        var result = await _adminQueries.GetAdminPostCommentsAsync(search, page, pageSize, HttpContext.RequestAborted);
        if (!result.Success || result.Result == null)
        {
            return Problem(
                statusCode: result.StatusCode,
                title: "ADMIN_POST_COMMENTS_FAILED",
                detail: result.Message
            );
        }

        return Ok(result.Result);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = AuthorizationPolicies.CommentsModerate)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeletePostComment(int id, CancellationToken cancellationToken)
    {
        if (id < 1)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Invalid comment ID.");
        }

        if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int currentUserId, out ActionResult? failureResult))
        {
            return failureResult!;
        }

        var result = await _adminQueries.SoftDeletePostCommentAsync(id, currentUserId, cancellationToken);
        if (result.Success)
        {
            return Ok(new { Message = result.Message });
        }

        return Problem(
            statusCode: result.StatusCode,
            title: "POST_COMMENT_DELETE_FAILED",
            detail: result.Message
        );
    }
}
