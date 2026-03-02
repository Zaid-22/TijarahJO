using System;
using System.Threading;
using System.Threading.Tasks;
using TijarahJo.Domain.Models;
using TijarahJoDB.Application.Abstractions.Services;

namespace TijarahJoDB.Application.Services;

public sealed class ReviewSubmissionService : IReviewSubmissionService
{
    private readonly IReviewService _reviews;

    public ReviewSubmissionService(IReviewService reviews)
    {
        _reviews = reviews;
    }

    public async Task<ReviewSubmissionResult> SubmitAsync(
        int reviewerId,
        int reviewedUserId,
        int rating,
        string? comment,
        CancellationToken cancellationToken = default
    )
    {
        if (reviewerId < 1 || reviewedUserId < 1 || rating < 1 || rating > 5 || string.IsNullOrWhiteSpace(comment))
        {
            return Failure(ReviewSubmissionFailureReason.InvalidRequest, "Review payload is invalid.");
        }

        if (reviewerId == reviewedUserId)
        {
            return Failure(ReviewSubmissionFailureReason.SelfReviewForbidden, "You cannot review yourself.");
        }

        if (!await _reviews.CanReviewAsync(reviewerId, reviewedUserId, cancellationToken))
        {
            return Failure(ReviewSubmissionFailureReason.AlreadyReviewed, "You have already reviewed this user.");
        }

        var review = new ReviewModel
        {
            ReviewID = null,
            ReviewerID = reviewerId,
            ReviewedUserID = reviewedUserId,
            Rating = rating,
            Comment = comment.Trim(),
            Timestamp = DateTime.UtcNow
        };

        var newReview = _reviews.Create(review);
        bool saved = await _reviews.SaveAsync(newReview, cancellationToken);
        if (!saved)
        {
            return Failure(ReviewSubmissionFailureReason.PersistenceFailed, "Failed to save review.");
        }

        return new ReviewSubmissionResult
        {
            Success = true,
            Review = newReview
        };
    }

    private static ReviewSubmissionResult Failure(ReviewSubmissionFailureReason reason, string message)
    {
        return new ReviewSubmissionResult
        {
            Success = false,
            FailureReason = reason,
            Message = message
        };
    }
}
