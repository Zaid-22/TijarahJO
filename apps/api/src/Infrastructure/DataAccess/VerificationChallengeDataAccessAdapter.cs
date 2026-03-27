using Microsoft.EntityFrameworkCore;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Domain.Entities;
using TijarahJo.Infrastructure.Persistence;

namespace TijarahJo.Infrastructure.DataAccess;

public sealed class VerificationChallengeDataAccessAdapter : IVerificationChallengeDataAccess
{
    private readonly TijarahJoDbContext _dbContext;

    public VerificationChallengeDataAccessAdapter(TijarahJoDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<string?> GetChallengeStateAsync(int userId, string challengeType, CancellationToken cancellationToken = default)
    {
        var challenge = await _dbContext.VerificationChallenges
            .Where(c => c.UserId == userId && c.ChallengeType == challengeType)
            .FirstOrDefaultAsync(cancellationToken);

        return challenge?.StateJson;
    }

    public async Task UpsertChallengeStateAsync(int userId, string challengeType, string stateJson, DateTime expiresAt, CancellationToken cancellationToken = default)
    {
        var challenge = await _dbContext.VerificationChallenges
            .Where(c => c.UserId == userId && c.ChallengeType == challengeType)
            .FirstOrDefaultAsync(cancellationToken);

        if (challenge == null)
        {
            challenge = new VerificationChallengeEntity
            {
                ChallengeId = Guid.NewGuid().ToString("N"),
                UserId = userId,
                ChallengeType = challengeType,
                StateJson = stateJson,
                ExpiresAt = expiresAt,
                CreatedAt = DateTime.UtcNow
            };
            _dbContext.VerificationChallenges.Add(challenge);
        }
        else
        {
            challenge.StateJson = stateJson;
            challenge.ExpiresAt = expiresAt;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteChallengeStateAsync(int userId, string challengeType, CancellationToken cancellationToken = default)
    {
        await _dbContext.VerificationChallenges
            .Where(c => c.UserId == userId && c.ChallengeType == challengeType)
            .ExecuteDeleteAsync(cancellationToken);
    }
}
