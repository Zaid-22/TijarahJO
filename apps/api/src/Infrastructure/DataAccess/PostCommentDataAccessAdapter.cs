using Microsoft.EntityFrameworkCore;
using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Domain.Entities;
using TijarahJo.Infrastructure.Persistence;

namespace TijarahJo.Infrastructure.DataAccess;

public sealed class PostCommentDataAccessAdapter(TijarahJoDbContext dbContext) : IPostCommentDataAccess
{
    private readonly TijarahJoDbContext _dbContext = dbContext;

    public async Task<int> AddCommentAsync(PostCommentModel comment, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var entity = new PostCommentEntity
        {
            PostID = comment.PostID,
            UserID = comment.UserID,
            ParentCommentID = comment.ParentCommentID,
            Content = comment.Content,
            CreatedAt = now,
            UpdatedAt = now
        };

        _dbContext.PostComments.Add(entity);
        _dbContext.AuditActorUserId = comment.UserID > 0 ? comment.UserID : null;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return entity.CommentID;
    }

    public async Task<IReadOnlyList<PostCommentModel>> GetTopLevelCommentsByPostIdAsync(
        int postId, int pageNumber = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        int skip = (pageNumber - 1) * pageSize;

        return await _dbContext.PostComments
            .AsNoTracking()
            .Where(c => c.PostID == postId && c.ParentCommentID == null)
            .Join(
                _dbContext.Users.AsNoTracking(),
                comment => comment.UserID,
                user => user.UserID,
                (comment, user) => new PostCommentModel
                {
                    CommentID = comment.CommentID,
                    PostID = comment.PostID,
                    UserID = comment.UserID,
                    ParentCommentID = comment.ParentCommentID,
                    Content = comment.Content,
                    CreatedAt = comment.CreatedAt,
                    UpdatedAt = comment.UpdatedAt,
                    AuthorName = ((user.FirstName ?? string.Empty) + " " + (user.LastName ?? string.Empty)).Trim(),
                    AuthorAvatar = user.Avatar,
                    ReplyCount = _dbContext.PostComments
                        .Count(r => r.ParentCommentID.HasValue && r.ParentCommentID.Value == comment.CommentID)
                })
            .OrderByDescending(c => c.CreatedAt)
            .ThenByDescending(c => c.CommentID)
            .Skip(skip)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<PostCommentModel>> GetRepliesByParentIdAsync(
        int parentCommentId, int pageNumber = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        int skip = (pageNumber - 1) * pageSize;

        return await _dbContext.PostComments
            .AsNoTracking()
            .Where(c => c.ParentCommentID == parentCommentId)
            .Join(
                _dbContext.Users.AsNoTracking(),
                comment => comment.UserID,
                user => user.UserID,
                (comment, user) => new PostCommentModel
                {
                    CommentID = comment.CommentID,
                    PostID = comment.PostID,
                    UserID = comment.UserID,
                    ParentCommentID = comment.ParentCommentID,
                    Content = comment.Content,
                    CreatedAt = comment.CreatedAt,
                    UpdatedAt = comment.UpdatedAt,
                    AuthorName = (user.FirstName + " " + (user.LastName ?? string.Empty)).Trim(),
                    AuthorAvatar = user.Avatar,
                    ReplyCount = 0
                })
            .OrderBy(c => c.CreatedAt)
            .ThenBy(c => c.CommentID)
            .Skip(skip)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<PostCommentModel?> GetCommentByIdAsync(int commentId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.PostComments
            .AsNoTracking()
            .Where(c => c.CommentID == commentId)
            .Join(
                _dbContext.Users.AsNoTracking(),
                comment => comment.UserID,
                user => user.UserID,
                (comment, user) => new PostCommentModel
                {
                    CommentID = comment.CommentID,
                    PostID = comment.PostID,
                    UserID = comment.UserID,
                    ParentCommentID = comment.ParentCommentID,
                    Content = comment.Content,
                    CreatedAt = comment.CreatedAt,
                    UpdatedAt = comment.UpdatedAt,
                    AuthorName = (user.FirstName + " " + (user.LastName ?? string.Empty)).Trim(),
                    AuthorAvatar = user.Avatar,
                    ReplyCount = 0
                })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<bool> UpdateCommentAsync(int commentId, string content, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.PostComments
            .FirstOrDefaultAsync(c => c.CommentID == commentId, cancellationToken);

        if (entity == null) return false;

        entity.Content = content;
        entity.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteCommentAsync(int commentId, int actorUserId, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.PostComments
            .FirstOrDefaultAsync(c => c.CommentID == commentId, cancellationToken);

        if (entity == null) return false;

        entity.IsDeleted = true;
        _dbContext.AuditActorUserId = actorUserId > 0 ? actorUserId : null;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<int> GetRecentCommentCountAsync(int userId, TimeSpan window, CancellationToken cancellationToken = default)
    {
        var cutoff = DateTime.UtcNow - window;
        return await _dbContext.PostComments
            .AsNoTracking()
            .Where(c => c.UserID == userId && c.CreatedAt >= cutoff)
            .CountAsync(cancellationToken);
    }

    public async Task<int> GetCommentCountByPostIdAsync(int postId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.PostComments
            .AsNoTracking()
            .Where(c => c.PostID == postId)
            .CountAsync(cancellationToken);
    }
}
