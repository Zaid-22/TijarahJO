using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJo.Api.Common.Utils;
using TijarahJo.Api.Contracts.Requests;
using TijarahJo.Api.Contracts.Responses;

namespace TijarahJo.Api.Features.Reviews
{
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/reviews")]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewService _reviews;
        private readonly IReviewSubmissionService _reviewSubmissions;

        public ReviewsController(IReviewService reviews, IReviewSubmissionService reviewSubmissions)
        {
            _reviews = reviews;
            _reviewSubmissions = reviewSubmissions;
        }

        [HttpGet("user/{userId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<ReviewResponseDTO>>> GetUserReviews(int userId)
        {
            if (userId < 1) return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Invalid user ID");
            IReadOnlyList<TijarahJo.Domain.Models.ReviewModel> reviews = await _reviews.GetReviewsAsync(userId, HttpContext.RequestAborted);
            return Ok(reviews.Select(DTOMapper.ToReviewResponseDTO).ToList());
        }

        [Authorize]
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<ReviewResponseDTO>> AddReview([FromBody] CreateReviewRequest? request)
        {
            if (!ApiControllerHelpers.TryGetCurrentUserId(User, out int currentUserId))
            {
                return Problem(statusCode: StatusCodes.Status401Unauthorized, detail: "Invalid authentication token.");
            }

            if (request == null)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Review payload is required.");
            }

            ReviewSubmissionResult result = await _reviewSubmissions.SubmitAsync(
                currentUserId,
                request.ReviewedUserID,
                request.Rating,
                request.Comment,
                HttpContext.RequestAborted
            );
            if (!result.Success || result.Review == null)
            {
                return ToFailure(result);
            }

            return CreatedAtAction(
                nameof(GetUserReviews),
                new { userId = result.Review.ReviewModel.ReviewedUserID },
                DTOMapper.ToReviewResponseDTO(result.Review.ReviewModel)
            );
        }

        private ActionResult<ReviewResponseDTO> ToFailure(ReviewSubmissionResult result)
        {
            return result.FailureReason switch
            {
                ReviewSubmissionFailureReason.InvalidRequest => Problem(statusCode: StatusCodes.Status400BadRequest, detail: result.Message),
                ReviewSubmissionFailureReason.SelfReviewForbidden => Problem(statusCode: StatusCodes.Status400BadRequest, detail: result.Message),
                ReviewSubmissionFailureReason.AlreadyReviewed => Problem(statusCode: StatusCodes.Status403Forbidden, detail: result.Message),
                _ => Problem(statusCode: StatusCodes.Status500InternalServerError, detail: result.Message ?? "Failed to save review.")
            };
        }
    }
}
