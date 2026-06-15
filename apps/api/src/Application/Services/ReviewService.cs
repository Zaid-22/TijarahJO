using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Common;

namespace TijarahJo.Application.Services;

public sealed class ReviewService : IReviewService
{
    private readonly IReviewDataAccess _reviews;

    public ReviewService(IReviewDataAccess reviews)
    {
        _reviews = reviews;
    }

    public async Task<IReadOnlyList<ReviewModel>> GetReviewsAsync(int userId, CancellationToken cancellationToken = default)
    {
        return await _reviews.GetReviewsByUserIdAsync(userId, cancellationToken);
    }

    public async Task<bool> CanReviewAsync(int reviewerId, int reviewedUserId, CancellationToken cancellationToken = default)
    {
        if (reviewerId == reviewedUserId)
        {
            return false;
        }

        return !await _reviews.HasReviewedAsync(reviewerId, reviewedUserId, cancellationToken);
    }

    public async Task<IReadOnlyDictionary<int, (double AverageRating, int ReviewCount)>> GetRatingsByUserIdsAsync(
        IReadOnlyList<int> userIds,
        CancellationToken cancellationToken = default)
    {
        return await _reviews.GetRatingsByUserIdsAsync(userIds, cancellationToken);
    }

    public Review Create(ReviewModel model) => new(model);

    public async Task<bool> SaveAsync(Review review, CancellationToken cancellationToken = default)
    {
        int reviewId = await _reviews.AddReviewAsync(review.ReviewModel, cancellationToken);
        if (reviewId <= 0)
        {
            return false;
        }

        review.ReviewModel = review.ReviewModel with { ReviewID = reviewId };
        return true;
    }
}
