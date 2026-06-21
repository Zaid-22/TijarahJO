using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Api.Common.Utils;
using TijarahJo.Api.Contracts.Requests;
using TijarahJo.Api.Contracts.Responses;

namespace TijarahJo.Api.Features.Reviews
{
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/reviews")]
    public class ReviewsController(IReviewService reviews, IReviewSubmissionService reviewSubmissions) : ControllerBase
    {
        [HttpGet("user/{userId}")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<ReviewResponseDTO>>> GetUserReviews(int userId)
        {
            if (userId < 1) return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Invalid user ID");
            IReadOnlyList<TijarahJo.Domain.Models.ReviewModel> reviewList = await reviews.GetReviewsAsync(userId, HttpContext.RequestAborted);
            return Ok(reviewList.Select(r => DTOMapper.ToReviewResponseDTO(r, Request)).ToList());
        }

        /// <summary>
        /// Returns aggregated rating stats (average rating + review count) for a batch of seller user IDs.
        /// Accepts a comma-separated list via query parameter, e.g. GET /reviews/ratings?userIds=1,2,3
        /// Maximum 100 IDs per request.
        /// </summary>
        [HttpGet("ratings")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<Dictionary<int, SellerRatingDTO>>> GetBatchRatings([FromQuery] string? userIds)
        {
            if (string.IsNullOrWhiteSpace(userIds))
                return Ok(new Dictionary<int, SellerRatingDTO>());

            var parsedIds = userIds
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(s => int.TryParse(s, out int id) && id > 0 ? (int?)id : null)
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .Distinct()
                .Take(100)
                .ToList();

            if (parsedIds.Count == 0)
                return Ok(new Dictionary<int, SellerRatingDTO>());

            var stats = await reviews.GetRatingsByUserIdsAsync(parsedIds, HttpContext.RequestAborted);

            var result = stats.ToDictionary(
                kvp => kvp.Key,
                kvp => new SellerRatingDTO
                {
                    AverageRating = kvp.Value.AverageRating,
                    ReviewCount = kvp.Value.ReviewCount
                });

            return Ok(result);
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

            ReviewSubmissionResult result = await reviewSubmissions.SubmitAsync(
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
                DTOMapper.ToReviewResponseDTO(result.Review.ReviewModel, Request)
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
