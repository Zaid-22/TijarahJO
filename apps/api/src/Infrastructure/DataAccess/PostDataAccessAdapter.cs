using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Common;
using TijarahJo.Domain.Entities;
using TijarahJo.Infrastructure.Persistence;

namespace TijarahJo.Infrastructure.DataAccess;


public sealed class PostDataAccessAdapter : IPostDataAccess
{
    private readonly TijarahJoDbContext _dbContext;

    public PostDataAccessAdapter(TijarahJoDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PostModel?> GetPostByIDAsync(int? postId, CancellationToken cancellationToken = default)
    {
        if (!postId.HasValue || postId.Value < 1)
        {
            return null;
        }

        PostEntity? entity = await _dbContext.Posts
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.PostID == postId.Value, cancellationToken);
        return entity is null ? null : ToModel(entity);
    }

    public async Task<int> AddPostAsync(PostModel post, CancellationToken cancellationToken = default)
    {
        if (!PostStatusPolicy.IsAllowedPersistedStatus(post.Status))
        {
            return 0;
        }

        var entity = new PostEntity
        {
            UserID = post.UserID,
            CategoryID = post.CategoryID,
            PostTitle = post.PostTitle,
            PostDescription = post.PostDescription,
            Price = post.Price,
            Status = post.Status,
            CreatedAt = post.CreatedAt == default ? DateTime.UtcNow : post.CreatedAt,
            IsDeleted = post.IsDeleted,
            Views = Math.Max(post.Views, 0L),
            CityID = post.CityId,
            AreaID = post.AreaId
        };

        await _dbContext.Posts.AddAsync(entity, cancellationToken);
        _dbContext.AuditActorUserId = post.UserID > 0 ? post.UserID : null;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return entity.PostID;
    }

    public async Task<bool> UpdatePostAsync(PostModel post, CancellationToken cancellationToken = default)
    {
        if (!post.PostID.HasValue || post.PostID.Value < 1 || !PostStatusPolicy.IsAllowedPersistedStatus(post.Status))
        {
            return false;
        }

        PostEntity? entity = await _dbContext.Posts
            .FirstOrDefaultAsync(item => item.PostID == post.PostID.Value, cancellationToken);
        if (entity is null)
        {
            return false;
        }

        entity.UserID = post.UserID;
        entity.CategoryID = post.CategoryID;
        entity.PostTitle = post.PostTitle;
        entity.PostDescription = post.PostDescription;
        entity.Price = post.Price;
        entity.Status = post.Status;
        entity.CreatedAt = post.CreatedAt == default ? entity.CreatedAt : post.CreatedAt;
        entity.CityID = post.CityId;
        entity.AreaID = post.AreaId;

        _dbContext.AuditActorUserId = post.UserID > 0 ? post.UserID : null;
        return await _dbContext.SaveChangesAsync(cancellationToken) > 0;
    }

    public async Task<bool> DeletePostAsync(int? postId, int actorUserId, CancellationToken cancellationToken = default)
    {
        if (!postId.HasValue || postId.Value < 1)
        {
            return false;
        }

        PostEntity? post = await _dbContext.Posts.FirstOrDefaultAsync(item => item.PostID == postId.Value, cancellationToken);
        if (post is null)
        {
            return false;
        }

        if (post.IsDeleted)
        {
            return false;
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            post.IsDeleted = true;

            int effectiveActorId = actorUserId > 0 ? actorUserId : (post.UserID > 0 ? post.UserID : 0);
            _dbContext.AuditActorUserId = effectiveActorId == 0 ? null : effectiveActorId;

            if (effectiveActorId > 0)
            {
                _dbContext.AuditLogs.Add(new AuditLogEntity
                {
                    TableName = "PostImages",
                    Action = "UPDATE",
                    ChangedByUserID = effectiveActorId,
                    ChangedAt = DateTime.UtcNow,
                    OldValues = $"{{\"PostID\":{postId.Value},\"IsDeleted\":false}}",
                    NewValues = $"{{\"PostID\":{postId.Value},\"IsDeleted\":true}}"
                });

                _dbContext.AuditLogs.Add(new AuditLogEntity
                {
                    TableName = "Favorites",
                    Action = "UPDATE",
                    ChangedByUserID = effectiveActorId,
                    ChangedAt = DateTime.UtcNow,
                    OldValues = $"{{\"PostID\":{postId.Value},\"IsDeleted\":false}}",
                    NewValues = $"{{\"PostID\":{postId.Value},\"IsDeleted\":true}}"
                });
            }
            await _dbContext.PostImages
                .Where(item => item.PostID == postId.Value && !item.IsDeleted)
                .ExecuteUpdateAsync(setters => setters.SetProperty(item => item.IsDeleted, true), cancellationToken);

            await _dbContext.Favorites
                .Where(item => item.PostID == postId.Value && !item.IsDeleted)
                .ExecuteUpdateAsync(setters => setters.SetProperty(item => item.IsDeleted, true), cancellationToken);

            bool deleted = await _dbContext.SaveChangesAsync(cancellationToken) > 0;
            if (!deleted)
            {
                await transaction.RollbackAsync(cancellationToken);
                return false;
            }

            await transaction.CommitAsync(cancellationToken);
            return true;
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<bool> DoesPostExistAsync(int? postId, CancellationToken cancellationToken = default)
    {
        return postId.HasValue
               && postId.Value > 0
               && await _dbContext.Posts
                   .AsNoTracking()
                   .AnyAsync(item => item.PostID == postId.Value, cancellationToken);
    }

    public async Task<bool> IncrementPostViewsAsync(int? postId, CancellationToken cancellationToken = default)
    {
        if (!postId.HasValue || postId.Value < 1)
        {
            return false;
        }

        int rowsAffected = await _dbContext.Posts
            .Where(item => item.PostID == postId.Value && !item.IsDeleted)
            .ExecuteUpdateAsync(setters => setters.SetProperty(item => item.Views, item => item.Views + 1), cancellationToken);
        return rowsAffected > 0;
    }

    public async Task<IReadOnlyList<PostModel>> GetPostsByUserIDAsync(int userId, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
    {
        List<PostEntity> entities = await _dbContext.Posts
            .AsNoTracking()
            .Where(item => item.UserID == userId && !item.IsDeleted)
            .OrderByDescending(item => item.CreatedAt)
            .ThenByDescending(item => item.PostID)
            .Skip((Math.Max(pageNumber, 1) - 1) * Math.Clamp(pageSize, 1, 100))
            .Take(Math.Clamp(pageSize, 1, 100))
            .ToListAsync(cancellationToken);

        return entities.Select(ToModel).ToList();
    }

    public async Task<IReadOnlyList<PostModel>> GetPostsByCategoryIDAsync(int categoryId, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
    {
        List<PostEntity> entities = await _dbContext.Posts
            .AsNoTracking()
            .Where(item => item.CategoryID == categoryId && !item.IsDeleted)
            .OrderByDescending(item => item.CreatedAt)
            .ThenByDescending(item => item.PostID)
            .Skip((Math.Max(pageNumber, 1) - 1) * Math.Clamp(pageSize, 1, 100))
            .Take(Math.Clamp(pageSize, 1, 100))
            .ToListAsync(cancellationToken);

        return entities.Select(ToModel).ToList();
    }

    private static PostModel ToModel(PostEntity entity)
    {
        return new PostModel(
            entity.PostID,
            entity.UserID,
            entity.CategoryID,
            entity.PostTitle,
            entity.PostDescription ?? string.Empty,
            entity.Price,
            entity.Status,
            entity.CreatedAt,
            entity.IsDeleted,
            entity.Views,
            entity.CityID,
            entity.AreaID
        );
    }
}
