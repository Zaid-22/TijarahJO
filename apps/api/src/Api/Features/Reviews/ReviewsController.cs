using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.BLL;

namespace TijarahJoDBAPI.Features.Reviews
{
    [ApiController]
    [Route("api/reviews")]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewService _reviews;

        public ReviewsController(IReviewService reviews)
        {
            _reviews = reviews;
        }

        [HttpGet("user/{userId}", Name = "GetUserReviews")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public ActionResult<IEnumerable<ReviewModel>> GetUserReviews(int userId)
        {
            if (userId < 1) return BadRequest("Invalid user ID");
            var reviews = _reviews.GetReviews(userId);
            return Ok(reviews);
        }

        [Authorize]
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public ActionResult<ReviewModel> AddReview([FromBody] ReviewModel? review)
        {
             var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int currentUserId))
            {
                return Unauthorized();
            }

            if (review == null)
            {
                return BadRequest("Review payload is required.");
            }

            if (review.ReviewedUserID <= 0)
            {
                return BadRequest("Reviewed user ID is required.");
            }

            if (review.Rating < 1 || review.Rating > 5)
            {
                return BadRequest("Rating must be between 1 and 5.");
            }

            if (string.IsNullOrWhiteSpace(review.Comment))
            {
                return BadRequest("Review comment is required.");
            }

            if (review.ReviewedUserID == currentUserId)
            {
                return BadRequest("You cannot review yourself.");
            }

            if (!_reviews.CanReview(currentUserId, review.ReviewedUserID))
            {
                 return StatusCode(StatusCodes.Status403Forbidden, "You have already reviewed this user.");
            }

            review.ReviewerID = currentUserId;
            review.Timestamp = DateTime.UtcNow;

            var newReview = _reviews.Create(review);
            if (_reviews.Save(newReview))
            {
                return CreatedAtAction(nameof(GetUserReviews), new { userId = review.ReviewedUserID }, newReview.ReviewModel);
            }

            return StatusCode(StatusCodes.Status500InternalServerError, "Failed to save review");
        }
    }
}
