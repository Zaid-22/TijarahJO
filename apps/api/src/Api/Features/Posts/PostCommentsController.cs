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
    public class PostCommentsController : ControllerBase
    {
        private readonly ILogger<PostCommentsController> _logger;
        private readonly IPostCommentService _commentService;
        private readonly IPostReadService _postReads;

        public PostCommentsController(
            ILogger<PostCommentsController> logger,
            IPostCommentService commentService,
            IPostReadService postReads)
        {
            _logger = logger;
            _commentService = commentService;
            _postReads = postReads;
        }

        // GET /api/v1/posts/{postId}/comments?page=1&limit=20
        [HttpGet]
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

            var result = await _commentService.GetTopLevelCommentsAsync(postId, page, limit, cancellationToken);
            if (!result.Success)
                return ToCommentProblem(result.FailureReason, result.Message);

            return Ok(new PostCommentListResponseDTO
            {
                Comments = result.Comments.Select(c => DTOMapper.ToPostCommentResponseDTO(c, Request)).ToList(),
                TotalCount = result.TotalCount,
                Page = page,
                PageSize = limit
            });
        }

        // GET /api/v1/posts/{postId}/comments/{commentId}/replies?page=1&limit=20
        [HttpGet("{commentId:int}/replies")]
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

            var result = await _commentService.GetRepliesAsync(commentId, page, limit, cancellationToken);
            if (!result.Success)
                return ToCommentProblem(result.FailureReason, result.Message);

            return Ok(new PostCommentListResponseDTO
            {
                Comments = result.Comments.Select(c => DTOMapper.ToPostCommentResponseDTO(c, Request)).ToList(),
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

            var result = await _commentService.AddCommentAsync(
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

            var result = await _commentService.UpdateCommentAsync(commentId, currentUserId, request.Content, cancellationToken);

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
            var postResult = await _postReads.GetByIdAsync(postId, cancellationToken);
            if (postResult.Success && postResult.Post != null)
            {
                postOwnerId = postResult.Post.PostModel.UserID;
            }

            bool actorIsAdmin = ApiControllerHelpers.IsAdminUser(User);

            var result = await _commentService.DeleteCommentAsync(
                commentId, currentUserId, actorIsAdmin, postOwnerId, cancellationToken);

            if (!result.Success)
                return ToCommentProblem(result.FailureReason, result.Message);

            return Ok(new ApiMessageResponse { Message = "Comment deleted." });
        }

        // --- Helpers ---

        private ActionResult ToCommentProblem(PostCommentFailureReason? reason, string? message)
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
