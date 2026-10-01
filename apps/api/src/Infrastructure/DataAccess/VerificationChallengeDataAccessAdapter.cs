using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Domain.Entities;
using TijarahJo.Infrastructure.Persistence;

namespace TijarahJo.Infrastructure.DataAccess;

public sealed class VerificationChallengeDataAccessAdapter(TijarahJoDbContext dbContext) : IVerificationChallengeDataAccess
{

    public async Task<string?> GetChallengeStateAsync(int userId, string challengeType, CancellationToken cancellationToken = default)
    {
        var challenge = await dbContext.VerificationChallenges
            .AsNoTracking()
            .Where(c => c.UserId == userId && c.ChallengeType == challengeType)
            .SingleOrDefaultAsync(cancellationToken);

        return challenge?.StateJson;
    }

    public async Task UpsertChallengeStateAsync(int userId, string challengeType, string stateJson, DateTime expiresAt, CancellationToken cancellationToken = default)
    {
        int updated = await dbContext.VerificationChallenges
            .Where(c => c.UserId == userId && c.ChallengeType == challengeType)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(c => c.StateJson, stateJson)
                    .SetProperty(c => c.ExpiresAt, expiresAt),
                cancellationToken);

        if (updated > 0)
        {
            return;
        }

        var challenge = CreateChallenge(userId, challengeType, stateJson, expiresAt);
        dbContext.VerificationChallenges.Add(challenge);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return;
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            dbContext.Entry(challenge).State = EntityState.Detached;
        }

        await dbContext.VerificationChallenges
            .Where(c => c.UserId == userId && c.ChallengeType == challengeType)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(c => c.StateJson, stateJson)
                    .SetProperty(c => c.ExpiresAt, expiresAt),
                cancellationToken);
    }

    public async Task<bool> TryReplaceChallengeStateAsync(
        int userId,
        string challengeType,
        string? expectedStateJson,
        string stateJson,
        DateTime expiresAt,
        CancellationToken cancellationToken = default)
    {
        if (expectedStateJson is not null)
        {
            int updated = await dbContext.VerificationChallenges
                .Where(c =>
                    c.UserId == userId &&
                    c.ChallengeType == challengeType &&
                    c.StateJson == expectedStateJson)
                .ExecuteUpdateAsync(
                    setters => setters
                        .SetProperty(c => c.StateJson, stateJson)
                        .SetProperty(c => c.ExpiresAt, expiresAt),
                    cancellationToken);

            return updated == 1;
        }

        var challenge = CreateChallenge(userId, challengeType, stateJson, expiresAt);
        dbContext.VerificationChallenges.Add(challenge);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            dbContext.Entry(challenge).State = EntityState.Detached;
            return false;
        }
    }

    public async Task DeleteChallengeStateAsync(int userId, string challengeType, CancellationToken cancellationToken = default)
    {
        await dbContext.VerificationChallenges
            .Where(c => c.UserId == userId && c.ChallengeType == challengeType)
            .ExecuteDeleteAsync(cancellationToken);
    }

    public async Task<bool> TryDeleteChallengeStateAsync(
        int userId,
        string challengeType,
        string expectedStateJson,
        CancellationToken cancellationToken = default)
    {
        int deleted = await dbContext.VerificationChallenges
            .Where(c =>
                c.UserId == userId &&
                c.ChallengeType == challengeType &&
                c.StateJson == expectedStateJson)
            .ExecuteDeleteAsync(cancellationToken);

        return deleted == 1;
    }

    private static VerificationChallengeEntity CreateChallenge(
        int userId,
        string challengeType,
        string stateJson,
        DateTime expiresAt)
    {
        return new VerificationChallengeEntity
        {
            ChallengeId = Guid.NewGuid().ToString("N"),
            UserId = userId,
            ChallengeType = challengeType,
            StateJson = stateJson,
            ExpiresAt = expiresAt,
            CreatedAt = DateTime.UtcNow
        };
    }

    private static bool IsUniqueConstraintViolation(DbUpdateException exception)
    {
        for (Exception? current = exception; current is not null; current = current.InnerException)
        {
            if (current is SqlException sqlException && sqlException.Number is 2601 or 2627)
            {
                return true;
            }
        }

        return false;
    }
}
