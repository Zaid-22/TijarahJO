using System;
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
using Models;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDBAPI.Common.Services;
using TijarahJoDBAPI.Common.Utils;
using TijarahJoDBAPI.Contracts.Requests;
using TijarahJoDBAPI.Contracts.Responses;

namespace TijarahJoDBAPI.Features.Posts
{
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/posts")]
    public class UserPostsController : ControllerBase
    {
        private readonly ILogger<UserPostsController> _logger;
        private readonly PostsFeedService _postsFeedService;
        private readonly IPostReadService _postReads;
        private readonly IPostMutationService _postMutations;
        private readonly IPostStatusTransitionService _postStatusTransitions;

        public UserPostsController(
            ILogger<UserPostsController> logger,
            PostsFeedService postsFeedService,
            IPostReadService postReads,
            IPostMutationService postMutations,
            IPostStatusTransitionService postStatusTransitions)
        {
            _logger = logger;
            _postsFeedService = postsFeedService;
            _postReads = postReads;
            _postMutations = postMutations;
            _postStatusTransitions = postStatusTransitions;
        }

        public sealed class PostsFeedRequest
        {
            public int? Page { get; set; } = 1;
            public int? Limit { get; set; } = 20;
            public bool? IncludeDeleted { get; set; } = false;
        }

        // --- Feed ---

        [HttpGet("feed")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult> GetPostsFeed([FromQuery] PostsFeedRequest request, CancellationToken cancellationToken)
        {
            var normalizedRequest = _postsFeedService.NormalizeRequest(
                request.Page,
                request.Limit,
                request.IncludeDeleted
            );

            try
            {
                FeedResponse response = await _postsFeedService.FetchPostsFeedAsync(normalizedRequest, cancellationToken);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to fetch posts feed. page={Page}, limit={Limit}, includeDeleted={IncludeDeleted}",
                    normalizedRequest.Page,
                    normalizedRequest.Limit,
                    normalizedRequest.IncludeDeleted
                );

                return Problem(
                    statusCode: StatusCodes.Status500InternalServerError,
                    title: "POSTS_FEED_FAILED",
                    detail: "Failed to fetch posts feed.");
            }
        }

        // --- Read ---

        [HttpGet("{id:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<PostResponseDTO>> GetPostById(int id)
        {
            PostReadResult result = await _postReads.GetByIdAsync(id, HttpContext.RequestAborted);
            if (!result.Success || result.Post == null)
            {
                return this.ToPostReadProblem(result.FailureReason, result.Message, "Failed to fetch post.");
            }

            PostResponseDTO dto = DTOMapper.ToPostResponseDTO(result.Post.PostModel);
            return Ok(dto);
        }

        [HttpGet("Exists/{id:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<bool>> DoesPostExist(int id)
        {
            PostExistsResult result = await _postReads.ExistsAsync(id, HttpContext.RequestAborted);
            if (!result.Success)
            {
                return this.ToPostReadProblem(result.FailureReason, result.Message, "Failed to check post existence.");
            }

            return Ok(result.Exists);
        }

        [HttpPost("{id:int}/views")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<PostViewIncrementResponse>> IncrementPostViews(int id, CancellationToken cancellationToken)
        {
            PostViewIncrementResult result = await _postReads.IncrementViewsAsync(id, cancellationToken);
            if (!result.Success)
            {
                return this.ToPostReadProblem(result.FailureReason, result.Message, "Error incrementing view count");
            }

            return Ok(new PostViewIncrementResponse
            {
                Message = "View count incremented",
                PostId = id
            });
        }

        [HttpGet("user/{userId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<IEnumerable<PostResponseDTO>>> GetUserPosts(
            int userId,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 50)
        {
            PostReadCollectionResult result = await _postReads.GetByUserIdAsync(userId, pageNumber, pageSize, HttpContext.RequestAborted);
            if (!result.Success)
            {
                return this.ToPostReadProblem(result.FailureReason, result.Message, "Failed to fetch user posts.");
            }

            if (result.Posts.Count == 0)
            {
                return Ok(new List<PostResponseDTO>());
            }

            return Ok(result.Posts.Select(DTOMapper.ToPostResponseDTO).ToList());
        }

        [HttpGet("category/{categoryId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<IEnumerable<PostResponseDTO>>> GetPostsByCategory(
            int categoryId,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 50)
        {
            PostReadCollectionResult result = await _postReads.GetByCategoryIdAsync(categoryId, pageNumber, pageSize, HttpContext.RequestAborted);
            if (!result.Success)
            {
                return this.ToPostReadProblem(result.FailureReason, result.Message, "Failed to fetch category posts.");
            }

            if (result.Posts.Count == 0)
            {
                return Ok(new List<PostResponseDTO>());
            }

            return Ok(result.Posts.Select(DTOMapper.ToPostResponseDTO).ToList());
        }

        // --- Write ---

        [Authorize]
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<PostResponseDTO>> AddPost([FromBody] CreatePostRequest? request, CancellationToken cancellationToken)
        {
            if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int currentUserId, out ActionResult? failureResult))
            {
                return failureResult!;
            }

            if (request == null)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Invalid post data.");
            }

            PostMutationResult result = await _postMutations.CreateAsync(new CreatePostCommand
            {
                ActorUserId = currentUserId,
                ActorIsAdmin = IsAdminUser(User),
                CategoryId = request.CategoryID,
                Title = request.PostTitle,
                Description = request.PostDescription,
                Price = request.Price,
                CityId = request.CityId,
                AreaId = request.AreaId
            }, cancellationToken);

            if (result.Success && result.Post != null)
            {
                return CreatedAtAction(
                    nameof(GetPostById),
                    new { id = result.Post.PostID },
                    DTOMapper.ToPostResponseDTO(result.Post.PostModel)
                );
            }

            return this.ToPostMutationProblem(result, "Error adding post.");
        }

        [Authorize]
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<PostResponseDTO>> UpdatePost(int id, [FromBody] UpdatePostRequest? updatedPost, CancellationToken cancellationToken)
        {
            if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int currentUserId, out ActionResult? failureResult))
            {
                return failureResult!;
            }

            if (updatedPost == null)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Invalid post data.");
            }

            PostMutationResult result = await _postMutations.UpdateAsync(new UpdatePostCommand
            {
                PostId = id,
                ActorUserId = currentUserId,
                ActorIsAdmin = IsAdminUser(User),
                CategoryId = updatedPost.CategoryID,
                Title = updatedPost.PostTitle,
                Description = updatedPost.PostDescription,
                Price = updatedPost.Price,
                CityId = updatedPost.CityId,
                AreaId = updatedPost.AreaId
            }, cancellationToken);

            if (result.Success && result.Post != null)
            {
                return Ok(DTOMapper.ToPostResponseDTO(result.Post.PostModel));
            }

            return this.ToPostMutationProblem(result, "Error updating post.");
        }

        [Authorize]
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult> DeletePost(int id, CancellationToken cancellationToken)
        {
            if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int currentUserId, out ActionResult? failureResult))
            {
                return failureResult!;
            }

            PostMutationResult result = await _postMutations.DeleteAsync(
                postId: id,
                actorUserId: currentUserId,
                actorIsAdmin: IsAdminUser(User),
                cancellationToken: cancellationToken
            );

            if (result.Success)
            {
                return Ok(new ApiMessageResponse { Message = $"Post with ID {id} has been deleted." });
            }

            return this.ToPostMutationProblem(result, "Error deleting post.");
        }

        [Authorize]
        [HttpPatch("{id}/status")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<PostResponseDTO>> UpdatePostStatus(int id, [FromBody] UpdatePostStatusRequest request, CancellationToken cancellationToken)
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
                IsAdminUser(User),
                request.Status,
                cancellationToken
            );

            if (result.Success)
            {
                return Ok(DTOMapper.ToPostResponseDTO(result.Post!.PostModel));
            }

            return this.ToPostStatusProblem(result, "Error updating post status.");
        }

        // --- Helpers ---

        private static readonly DateTime SqlDateTimeMinUtc = new DateTime(1753, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        private static bool IsAdminUser(ClaimsPrincipal user)
        {
            return ApiControllerHelpers.IsAdminUser(user);
        }

        private static DateTime NormalizeSqlDateTime(DateTime value)
        {
            if (value == default || value < SqlDateTimeMinUtc)
            {
                return DateTime.UtcNow;
            }

            return value.Kind switch
            {
                DateTimeKind.Utc => value,
                DateTimeKind.Local => value.ToUniversalTime(),
                _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
            };
        }
    }
}
