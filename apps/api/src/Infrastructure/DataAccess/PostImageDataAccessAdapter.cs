using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Common;
using TijarahJo.Domain.Entities;
using TijarahJo.Infrastructure.Persistence;

namespace TijarahJo.Infrastructure.DataAccess;


public sealed class PostImageDataAccessAdapter : IPostImageDataAccess
{
    private readonly TijarahJoDbContext _dbContext;

    public PostImageDataAccessAdapter(TijarahJoDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public PostImageModel GetPostImageByID(int? postImageId)
    {
        if (!postImageId.HasValue || postImageId.Value < 1)
        {
            return null!;
        }

        PostImageEntity? entity = _dbContext.PostImages
            .AsNoTracking()
            .FirstOrDefault(item => item.PostImageID == postImageId.Value);
        return entity is null ? null! : ToModel(entity);
    }

    public async Task<PostImageModel> GetPostImageByIDAsync(int? postImageId, CancellationToken cancellationToken = default)
    {
        if (!postImageId.HasValue || postImageId.Value < 1)
        {
            return null!;
        }

        PostImageEntity? entity = await _dbContext.PostImages
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.PostImageID == postImageId.Value, cancellationToken);
        return entity is null ? null! : ToModel(entity);
    }

    public async Task<int> AddPostImageAsync(PostImageModel postImage, CancellationToken cancellationToken = default)
    {
        var entity = new PostImageEntity
        {
            PostID = postImage.PostID,
            PostImageURL = postImage.PostImageURL,
            UploadedAt = postImage.UploadedAt == default ? DateTime.UtcNow : postImage.UploadedAt,
            IsDeleted = postImage.IsDeleted
        };

        _dbContext.PostImages.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return entity.PostImageID;
    }

    public async Task<bool> UpdatePostImageAsync(PostImageModel postImage, CancellationToken cancellationToken = default)
    {
        if (!postImage.PostImageID.HasValue || postImage.PostImageID.Value < 1)
        {
            return false;
        }

        PostImageEntity? entity = await _dbContext.PostImages
            .FirstOrDefaultAsync(item => item.PostImageID == postImage.PostImageID.Value, cancellationToken);
        if (entity is null)
        {
            return false;
        }

        entity.PostID = postImage.PostID;
        entity.PostImageURL = postImage.PostImageURL;
        entity.UploadedAt = postImage.UploadedAt == default ? entity.UploadedAt : postImage.UploadedAt;
        entity.IsDeleted = postImage.IsDeleted;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeletePostImageAsync(int? postImageId, CancellationToken cancellationToken = default)
    {
        if (!postImageId.HasValue || postImageId.Value < 1)
        {
            return false;
        }

        PostImageEntity? entity = await _dbContext.PostImages
            .FirstOrDefaultAsync(item => item.PostImageID == postImageId.Value, cancellationToken);
        if (entity is null)
        {
            return false;
        }

        if (entity.IsDeleted)
        {
            return false;
        }

        entity.IsDeleted = true;
        return await _dbContext.SaveChangesAsync(cancellationToken) > 0;
    }

    public bool DoesPostImageExist(int? postImageId)
    {
        return postImageId.HasValue
               && postImageId.Value > 0
               && _dbContext.PostImages.AsNoTracking().Any(item => item.PostImageID == postImageId.Value);
    }

    public async Task<bool> DoesPostImageExistAsync(int? postImageId, CancellationToken cancellationToken = default)
    {
        return postImageId.HasValue
               && postImageId.Value > 0
               && await _dbContext.PostImages
                   .AsNoTracking()
                   .AnyAsync(item => item.PostImageID == postImageId.Value, cancellationToken);
    }

    public async Task<IReadOnlyList<PostImageModel>> GetAllPostImagesAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
    {
        int safePage = Math.Max(1, pageNumber);
        int safeSize = Math.Clamp(pageSize, 1, 200);

        List<PostImageEntity> entities = await _dbContext.PostImages
            .AsNoTracking()
            .Where(item => !item.IsDeleted)
            .OrderBy(item => item.UploadedAt)
            .ThenBy(item => item.PostImageID)
            .Skip((safePage - 1) * safeSize)
            .Take(safeSize)
            .ToListAsync(cancellationToken);

        return entities.Select(ToModel).ToList();
    }

    public IReadOnlyList<PostImageModel> GetPostImagesByPostID(int postId)
    {
        return _dbContext.PostImages
            .AsNoTracking()
            .Where(item => item.PostID == postId && !item.IsDeleted)
            .OrderBy(item => item.UploadedAt)
            .ThenBy(item => item.PostImageID)
            .Select(ToModel)
            .ToList();
    }

    public async Task<IReadOnlyList<PostImageModel>> GetPostImagesByPostIDAsync(int postId, CancellationToken cancellationToken = default)
    {
        List<PostImageEntity> entities = await _dbContext.PostImages
            .AsNoTracking()
            .Where(item => item.PostID == postId && !item.IsDeleted)
            .OrderBy(item => item.UploadedAt)
            .ThenBy(item => item.PostImageID)
            .ToListAsync(cancellationToken);

        return entities.Select(ToModel).ToList();
    }

    private static PostImageModel ToModel(PostImageEntity entity)
    {
        return new PostImageModel(
            entity.PostImageID,
            entity.PostID,
            entity.PostImageURL,
            entity.UploadedAt,
            entity.IsDeleted
        );
    }
}
