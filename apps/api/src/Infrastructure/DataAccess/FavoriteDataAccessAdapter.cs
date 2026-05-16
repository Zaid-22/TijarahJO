using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Common;
using TijarahJo.Domain.Entities;
using TijarahJo.Infrastructure.Persistence;

namespace TijarahJo.Infrastructure.DataAccess;


public sealed class FavoriteDataAccessAdapter(TijarahJoDbContext dbContext) : IFavoriteDataAccess
{

    public async Task<IReadOnlyList<FavoriteModel>> GetFavoritesByUserIdAsync(int userId, CancellationToken cancellationToken = default)
    {
        List<FavoriteEntity> entities = await dbContext.Favorites
            .AsNoTracking()
            .Where(item => item.UserID == userId && !item.IsDeleted)
            .OrderByDescending(item => item.CreatedAt)
            .ThenByDescending(item => item.FavoriteID)
            .ToListAsync(cancellationToken);

        return [.. entities.Select(item => new FavoriteModel(
            item.FavoriteID,
            item.UserID,
            item.PostID,
            item.CreatedAt
        ))];
    }

    public async Task<bool> AddFavoriteAsync(int userId, int postId, CancellationToken cancellationToken = default)
    {
        if (userId < 1 || postId < 1)
        {
            return false;
        }

        // Ignore the global soft-delete filter so we can revive a deleted favorite
        // instead of hitting the unique index with a duplicate insert.
        FavoriteEntity? existing = await dbContext.Favorites
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(item => item.UserID == userId && item.PostID == postId, cancellationToken);
        if (existing is not null)
        {
            if (existing.IsDeleted)
            {
                existing.IsDeleted = false;
                existing.CreatedAt = DateTime.UtcNow;
                return await dbContext.SaveChangesAsync(cancellationToken) > 0;
            }

            return true;
        }

        await dbContext.Favorites.AddAsync(new FavoriteEntity
        {
            UserID = userId,
            PostID = postId,
            CreatedAt = DateTime.UtcNow,
            IsDeleted = false
        }, cancellationToken);

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException)
        {
            return await dbContext.Favorites
                .IgnoreQueryFilters()
                .AsNoTracking()
                .AnyAsync(item => item.UserID == userId && item.PostID == postId && !item.IsDeleted, cancellationToken);
        }
    }

    public async Task<bool> RemoveFavoriteAsync(int userId, int postId, CancellationToken cancellationToken = default)
    {
        FavoriteEntity? entity = await dbContext.Favorites
            .FirstOrDefaultAsync(item => item.UserID == userId && item.PostID == postId && !item.IsDeleted, cancellationToken);
        if (entity is null)
        {
            return false;
        }

        entity.IsDeleted = true;
        return await dbContext.SaveChangesAsync(cancellationToken) > 0;
    }

    public Task<bool> IsFavoriteAsync(int userId, int postId, CancellationToken cancellationToken = default)
    {
        return dbContext.Favorites
            .AsNoTracking()
            .AnyAsync(item => item.UserID == userId && item.PostID == postId && !item.IsDeleted, cancellationToken);
    }
}
