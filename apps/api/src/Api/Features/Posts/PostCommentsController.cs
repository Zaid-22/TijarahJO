using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Api.Common.Utils;
using TijarahJo.Api.Contracts.Requests;
using TijarahJo.Api.Contracts.Responses;

namespace TijarahJo.Api.Features.Posts
{
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/posts/{postId:int}/comments")]
    public class PostCommentsController(
        IPostCommentService commentService,
        IPostReadService postReads) : ControllerBase
    {

        // GET /api/v1/posts/{postId}/comments?page=1&limit=20
        [HttpGet]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<PostCommentListResponseDTO>> GetComments(
            int postId,
            [FromQuery] int page = 1,
            [FromQuery] int limit = 20,
            CancellationToken cancellationToken = default)
        {
            if (postId < 1)
                return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Invalid post ID.");

            var result = await commentService.GetTopLevelCommentsAsync(postId, page, limit, cancellationToken);
            if (!result.Success)
                return ToCommentProblem(result.FailureReason, result.Message);

            return Ok(new PostCommentListResponseDTO
            {
                Comments = [.. result.Comments.Select(c => DTOMapper.ToPostCommentResponseDTO(c, Request))],
                TotalCount = result.TotalCount,
                Page = page,
                PageSize = limit
            });
        }

        // GET /api/v1/posts/{postId}/comments/{commentId}/replies?page=1&limit=20
        [HttpGet("{commentId:int}/replies")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<PostCommentListResponseDTO>> GetReplies(
            int postId,
            int commentId,
            [FromQuery] int page = 1,
            [FromQuery] int limit = 20,
            CancellationToken cancellationToken = default)
        {
            if (commentId < 1)
                return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Invalid comment ID.");

            var result = await commentService.GetRepliesAsync(postId, commentId, page, limit, cancellationToken);
            if (!result.Success)
                return ToCommentProblem(result.FailureReason, result.Message);

            return Ok(new PostCommentListResponseDTO
            {
                Comments = [.. result.Comments.Select(c => DTOMapper.ToPostCommentResponseDTO(c, Request))],
                TotalCount = result.TotalCount,
                Page = page,
                PageSize = limit
            });
        }

        // POST /api/v1/posts/{postId}/comments
        [Authorize]
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
        public async Task<ActionResult<PostCommentResponseDTO>> AddComment(
            int postId,
            [FromBody] CreatePostCommentRequest? request,
            CancellationToken cancellationToken = default)
        {
            if (!ApiControllerHelpers.TryGetCurrentUserId(User, out int currentUserId))
                return Problem(statusCode: StatusCodes.Status401Unauthorized, detail: "Invalid authentication token.");

            if (request == null)
                return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Comment payload is required.");

            var result = await commentService.AddCommentAsync(
                postId, currentUserId, request.Content, request.ParentCommentId, cancellationToken);

            if (!result.Success || result.Comment == null)
                return ToCommentProblem(result.FailureReason, result.Message);

            return CreatedAtAction(
                nameof(GetComments),
                new { postId },
                DTOMapper.ToPostCommentResponseDTO(result.Comment, Request));
        }

        // PUT /api/v1/posts/{postId}/comments/{commentId}
        [Authorize]
        [HttpPut("{commentId:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<PostCommentResponseDTO>> UpdateComment(
            int postId,
            int commentId,
            [FromBody] UpdatePostCommentRequest? request,
            CancellationToken cancellationToken = default)
        {
            if (!ApiControllerHelpers.TryGetCurrentUserId(User, out int currentUserId))
                return Problem(statusCode: StatusCodes.Status401Unauthorized, detail: "Invalid authentication token.");

            if (request == null)
                return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Update payload is required.");

            var result = await commentService.UpdateCommentAsync(postId, commentId, currentUserId, request.Content, cancellationToken);

            if (!result.Success || result.Comment == null)
                return ToCommentProblem(result.FailureReason, result.Message);

            return Ok(DTOMapper.ToPostCommentResponseDTO(result.Comment, Request));
        }

        // DELETE /api/v1/posts/{postId}/comments/{commentId}
        [Authorize]
        [HttpDelete("{commentId:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult> DeleteComment(
            int postId,
            int commentId,
            CancellationToken cancellationToken = default)
        {
            if (!ApiControllerHelpers.TryGetCurrentUserId(User, out int currentUserId))
                return Problem(statusCode: StatusCodes.Status401Unauthorized, detail: "Invalid authentication token.");

            // Resolve post owner for permission check
            int? postOwnerId = null;
            var postResult = await postReads.GetByIdAsync(postId, cancellationToken);
            if (postResult.Success && postResult.Post != null)
            {
                postOwnerId = postResult.Post.PostModel.UserID;
            }

            bool actorIsAdmin = ApiControllerHelpers.IsAdminUser(User);

            var result = await commentService.DeleteCommentAsync(
                postId, commentId, currentUserId, actorIsAdmin, postOwnerId, cancellationToken);

            if (!result.Success)
                return ToCommentProblem(result.FailureReason, result.Message);

            return Ok(new ApiMessageResponse { Message = "Comment deleted." });
        }

        // --- Helpers ---

        private ObjectResult ToCommentProblem(PostCommentFailureReason? reason, string? message)
        {
            return reason switch
            {
                PostCommentFailureReason.InvalidRequest =>
                    Problem(statusCode: StatusCodes.Status400BadRequest, detail: message),
                PostCommentFailureReason.PostNotFound =>
                    Problem(statusCode: StatusCodes.Status404NotFound, detail: message),
                PostCommentFailureReason.CommentNotFound =>
                    Problem(statusCode: StatusCodes.Status404NotFound, detail: message),
                PostCommentFailureReason.Forbidden =>
                    Problem(statusCode: StatusCodes.Status403Forbidden, detail: message),
                PostCommentFailureReason.RateLimited =>
                    Problem(statusCode: StatusCodes.Status429TooManyRequests, detail: message),
                _ => Problem(statusCode: StatusCodes.Status500InternalServerError,
                    detail: message ?? "An error occurred processing the comment.")
            };
        }
    }
}
