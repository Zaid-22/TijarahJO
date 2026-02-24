using Microsoft.EntityFrameworkCore;
using TijarahJoDB.Application.Abstractions.DataAccess;
using TijarahJoDB.DAL.Entities;
using TijarahJoDB.DAL.Persistence;

namespace TijarahJoDB_DataAccess;

public sealed class ExternalIdentityDataAccessAdapter : IExternalIdentityDataAccess
{
    private readonly TijarahJoDbContext _dbContext;

    public ExternalIdentityDataAccessAdapter(TijarahJoDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<int?> FindUserIdByProviderSubjectAsync(
        string provider,
        string providerSubject,
        CancellationToken cancellationToken = default)
    {
        string normalizedProvider = NormalizeProvider(provider);
        string normalizedSubject = providerSubject?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(normalizedProvider) || string.IsNullOrWhiteSpace(normalizedSubject))
        {
            return null;
        }

        return await _dbContext.UserExternalIdentities
            .AsNoTracking()
            .Where(item =>
                item.Provider == normalizedProvider &&
                item.ProviderSubject == normalizedSubject)
            .Select(item => (int?)item.UserID)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<ExternalIdentityLinkResult> LinkIdentityToUserAsync(
        int userId,
        string provider,
        string providerSubject,
        string? providerEmail,
        CancellationToken cancellationToken = default)
    {
        string normalizedProvider = NormalizeProvider(provider);
        string normalizedSubject = providerSubject?.Trim() ?? string.Empty;
        string? normalizedEmail = NormalizeEmail(providerEmail);

        if (userId < 1 || string.IsNullOrWhiteSpace(normalizedProvider) || string.IsNullOrWhiteSpace(normalizedSubject))
        {
            return new ExternalIdentityLinkResult
            {
                Status = ExternalIdentityLinkStatus.InvalidRequest
            };
        }

        UserExternalIdentityEntity? bySubject = await _dbContext.UserExternalIdentities
            .FirstOrDefaultAsync(
                item => item.Provider == normalizedProvider && item.ProviderSubject == normalizedSubject,
                cancellationToken
            );
        if (bySubject != null)
        {
            if (bySubject.UserID != userId)
            {
                return new ExternalIdentityLinkResult
                {
                    Status = ExternalIdentityLinkStatus.LinkedToAnotherUser,
                    LinkedUserId = bySubject.UserID
                };
            }

            bool changed = false;
            if (!string.Equals(bySubject.ProviderEmail, normalizedEmail, StringComparison.OrdinalIgnoreCase))
            {
                bySubject.ProviderEmail = normalizedEmail;
                changed = true;
            }

            if (changed)
            {
                bySubject.UpdatedAt = DateTime.UtcNow;
                await _dbContext.SaveChangesAsync(cancellationToken);
            }

            return new ExternalIdentityLinkResult
            {
                Status = ExternalIdentityLinkStatus.AlreadyLinkedToSameUser,
                LinkedUserId = bySubject.UserID
            };
        }

        UserExternalIdentityEntity? byUserAndProvider = await _dbContext.UserExternalIdentities
            .FirstOrDefaultAsync(
                item => item.UserID == userId && item.Provider == normalizedProvider,
                cancellationToken
            );
        if (byUserAndProvider != null)
        {
            return new ExternalIdentityLinkResult
            {
                Status = ExternalIdentityLinkStatus.Failed,
                LinkedUserId = byUserAndProvider.UserID
            };
        }

        await _dbContext.UserExternalIdentities.AddAsync(new UserExternalIdentityEntity
        {
            UserID = userId,
            Provider = normalizedProvider,
            ProviderSubject = normalizedSubject,
            ProviderEmail = normalizedEmail,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        }, cancellationToken);

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
            return new ExternalIdentityLinkResult
            {
                Status = ExternalIdentityLinkStatus.Linked,
                LinkedUserId = userId
            };
        }
        catch (DbUpdateException)
        {
            UserExternalIdentityEntity? afterConflict = await _dbContext.UserExternalIdentities
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    item => item.Provider == normalizedProvider && item.ProviderSubject == normalizedSubject,
                    cancellationToken
                );

            if (afterConflict != null && afterConflict.UserID == userId)
            {
                return new ExternalIdentityLinkResult
                {
                    Status = ExternalIdentityLinkStatus.AlreadyLinkedToSameUser,
                    LinkedUserId = userId
                };
            }

            if (afterConflict != null)
            {
                return new ExternalIdentityLinkResult
                {
                    Status = ExternalIdentityLinkStatus.LinkedToAnotherUser,
                    LinkedUserId = afterConflict.UserID
                };
            }

            return new ExternalIdentityLinkResult
            {
                Status = ExternalIdentityLinkStatus.Failed
            };
        }
    }

    private static string NormalizeProvider(string provider)
    {
        return string.IsNullOrWhiteSpace(provider)
            ? string.Empty
            : provider.Trim().ToLowerInvariant();
    }

    private static string? NormalizeEmail(string? email)
    {
        return string.IsNullOrWhiteSpace(email)
            ? null
            : email.Trim().ToLowerInvariant();
    }
}
