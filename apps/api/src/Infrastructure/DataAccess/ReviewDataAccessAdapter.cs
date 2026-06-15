using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Common;
using TijarahJo.Domain.Entities;
using TijarahJo.Infrastructure.Persistence;

namespace TijarahJo.Infrastructure.DataAccess;


public sealed class ReviewDataAccessAdapter(TijarahJoDbContext dbContext) : IReviewDataAccess
{

    public async Task<int> AddReviewAsync(ReviewModel review, CancellationToken cancellationToken = default)
    {
        var entity = new ReviewEntity
        {
            ReviewerID = review.ReviewerID,
            ReviewedUserID = review.ReviewedUserID,
            Rating = review.Rating,
            Comment = review.Comment,
            CreatedAt = review.Timestamp == default ? DateTime.UtcNow : review.Timestamp
        };

        dbContext.Reviews.Add(entity);
        dbContext.AuditActorUserId = review.ReviewerID > 0 ? review.ReviewerID : null;
        await dbContext.SaveChangesAsync(cancellationToken);
        return entity.ReviewID;
    }

    public async Task<IReadOnlyList<ReviewModel>> GetReviewsByUserIdAsync(int userId, CancellationToken cancellationToken = default)
    {
        return await dbContext.Reviews
            .AsNoTracking()
            .Where(r => r.ReviewedUserID == userId)
            .Join(
                dbContext.Users.AsNoTracking(),
                review => review.ReviewerID,
                user => user.UserID,
                (review, user) => new ReviewModel
                {
                    ReviewID = review.ReviewID,
                    ReviewerID = review.ReviewerID,
                    ReviewedUserID = review.ReviewedUserID,
                    Rating = review.Rating,
                    Comment = review.Comment ?? string.Empty,
                    Timestamp = review.CreatedAt,
                    ReviewerName = (user.FirstName + " " + (user.LastName ?? string.Empty)).Trim(),
                    ReviewerAvatar = user.Avatar
                })
            .OrderByDescending(r => r.Timestamp)
            .ThenByDescending(r => r.ReviewID)
            .ToListAsync(cancellationToken);
    }

    public Task<bool> HasReviewedAsync(int reviewerId, int reviewedUserId, CancellationToken cancellationToken = default)
    {
        return dbContext.Reviews
            .AsNoTracking()
            .AnyAsync(item => item.ReviewerID == reviewerId && item.ReviewedUserID == reviewedUserId, cancellationToken);
    }

    public async Task<IReadOnlyDictionary<int, (double AverageRating, int ReviewCount)>> GetRatingsByUserIdsAsync(
        IReadOnlyList<int> userIds,
        CancellationToken cancellationToken = default)
    {
        if (userIds == null || userIds.Count == 0)
            return new Dictionary<int, (double, int)>();

        // EF Core translates Contains() to SQL IN (...), giving us a single round-trip.
        var stats = await dbContext.Reviews
            .AsNoTracking()
            .Where(r => userIds.Contains(r.ReviewedUserID))
            .GroupBy(r => r.ReviewedUserID)
            .Select(g => new
            {
                UserId = g.Key,
                Average = g.Average(r => (double)r.Rating),
                Count = g.Count()
            })
            .ToListAsync(cancellationToken);

        return stats.ToDictionary(
            s => s.UserId,
            s => (s.Average, s.Count));
    }
}
