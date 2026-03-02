using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using Models;
using TijarahJoDB.Application.Abstractions.DataAccess;
using TijarahJoDB.Application.Common;
using TijarahJoDB.DAL.Entities;
using TijarahJoDB.DAL.Persistence;

namespace TijarahJoDB_DataAccess;


public sealed class FavoriteDataAccessAdapter : IFavoriteDataAccess
{
    private readonly TijarahJoDbContext _dbContext;

    public FavoriteDataAccessAdapter(TijarahJoDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<FavoriteModel>> GetFavoritesByUserIdAsync(int userId, CancellationToken cancellationToken = default)
    {
        List<FavoriteEntity> entities = await _dbContext.Favorites
            .AsNoTracking()
            .Where(item => item.UserID == userId && !item.IsDeleted)
            .OrderByDescending(item => item.CreatedAt)
            .ThenByDescending(item => item.FavoriteID)
            .ToListAsync(cancellationToken);

        return entities.Select(item => new FavoriteModel(
            item.FavoriteID,
            item.UserID,
            item.PostID,
            item.CreatedAt
        )).ToList();
    }

    public async Task<bool> AddFavoriteAsync(int userId, int postId, CancellationToken cancellationToken = default)
    {
        if (userId < 1 || postId < 1)
        {
            return false;
        }

        FavoriteEntity? existing = await _dbContext.Favorites
            .FirstOrDefaultAsync(item => item.UserID == userId && item.PostID == postId, cancellationToken);
        if (existing is not null)
        {
            if (existing.IsDeleted)
            {
                existing.IsDeleted = false;
                existing.CreatedAt = DateTime.UtcNow;
                return await _dbContext.SaveChangesAsync(cancellationToken) > 0;
            }

            return true;
        }

        await _dbContext.Favorites.AddAsync(new FavoriteEntity
        {
            UserID = userId,
            PostID = postId,
            CreatedAt = DateTime.UtcNow,
            IsDeleted = false
        }, cancellationToken);

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException)
        {
            return await _dbContext.Favorites
                .AsNoTracking()
                .AnyAsync(item => item.UserID == userId && item.PostID == postId && !item.IsDeleted, cancellationToken);
        }
    }

    public async Task<bool> RemoveFavoriteAsync(int userId, int postId, CancellationToken cancellationToken = default)
    {
        FavoriteEntity? entity = await _dbContext.Favorites
            .FirstOrDefaultAsync(item => item.UserID == userId && item.PostID == postId && !item.IsDeleted, cancellationToken);
        if (entity is null)
        {
            return false;
        }

        entity.IsDeleted = true;
        return await _dbContext.SaveChangesAsync(cancellationToken) > 0;
    }

    public Task<bool> IsFavoriteAsync(int userId, int postId, CancellationToken cancellationToken = default)
    {
        return _dbContext.Favorites
            .AsNoTracking()
            .AnyAsync(item => item.UserID == userId && item.PostID == postId && !item.IsDeleted, cancellationToken);
    }
}
