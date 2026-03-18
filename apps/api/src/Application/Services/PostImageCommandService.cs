using System;
using System.Threading;
using System.Threading.Tasks;
using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Common;

namespace TijarahJo.Application.Services;

public sealed class PostImageCommandService : IPostImageCommandService
{
    private static readonly DateTime SqlDateTimeMinUtc = new(1753, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private readonly IPostService _posts;
    private readonly IPostImageService _postImages;

    public PostImageCommandService(IPostService posts, IPostImageService postImages)
    {
        _posts = posts;
        _postImages = postImages;
    }

    public async Task<PostImageCommandResult> CreateAsync(
        int actorUserId,
        bool actorIsAdmin,
        int postId,
        string? postImageUrl,
        DateTime? uploadedAt = null,
        CancellationToken cancellationToken = default
    )
    {
        if (actorUserId < 1 || postId < 1 || string.IsNullOrWhiteSpace(postImageUrl))
        {
            return Failure(PostImageCommandFailureReason.InvalidRequest, "Invalid post image data.");
        }

        Post? post = await _posts.FindAsync(postId, cancellationToken);
        if (post == null)
        {
            return Failure(PostImageCommandFailureReason.PostNotFound, $"Post with ID {postId} not found.");
        }

        if (post.IsDeleted)
        {
            return Failure(PostImageCommandFailureReason.PostDeleted, "Cannot add images to a deleted post.");
        }

        if (post.UserID != actorUserId && !actorIsAdmin)
        {
            return Failure(PostImageCommandFailureReason.Forbidden, "You can only add images to your own posts.");
        }

        PostImage postImage = _postImages.Create(new PostImageModel(
            null,
            postId,
            postImageUrl.Trim(),
            NormalizeSqlDateTime(uploadedAt ?? DateTime.UtcNow),
            false
        ));

        bool saved = await _postImages.SaveAsync(postImage, cancellationToken);
        if (!saved)
        {
            return Failure(PostImageCommandFailureReason.PersistenceFailed, "Error adding PostImage.");
        }

        return new PostImageCommandResult
        {
            Success = true,
            PostImage = postImage
        };
    }

    public async Task<PostImageCommandResult> UpdateAsync(
        int actorUserId,
        bool actorIsAdmin,
        int postImageId,
        int requestedPostId,
        string? postImageUrl,
        DateTime? uploadedAt = null,
        CancellationToken cancellationToken = default
    )
    {
        if (actorUserId < 1 || postImageId < 1 || requestedPostId < 1 || string.IsNullOrWhiteSpace(postImageUrl))
        {
            return Failure(PostImageCommandFailureReason.InvalidRequest, "Invalid post image data.");
        }

        PostImage? postImage = await _postImages.FindAsync(postImageId, cancellationToken);
        if (postImage == null)
        {
            return Failure(PostImageCommandFailureReason.PostImageNotFound, $"PostImage with ID {postImageId} not found.");
        }

        Post? post = await _posts.FindAsync(postImage.PostID, cancellationToken);
        if (post == null)
        {
            return Failure(PostImageCommandFailureReason.PostNotFound, $"Post with ID {postImage.PostID} not found.");
        }

        if (post.IsDeleted)
        {
            return Failure(PostImageCommandFailureReason.PostDeleted, "Cannot update images on a deleted post.");
        }

        if (post.UserID != actorUserId && !actorIsAdmin)
        {
            return Failure(PostImageCommandFailureReason.Forbidden, "You can only update images on your own posts.");
        }

        if (requestedPostId != postImage.PostID)
        {
            return Failure(PostImageCommandFailureReason.CrossPostMoveNotAllowed, "Moving an image to another post is not allowed.");
        }

        postImage.PostImageURL = postImageUrl.Trim();
        postImage.UploadedAt = NormalizeSqlDateTime(uploadedAt ?? postImage.UploadedAt, postImage.UploadedAt);

        bool saved = await _postImages.SaveAsync(postImage, cancellationToken);
        if (!saved)
        {
            return Failure(PostImageCommandFailureReason.PersistenceFailed, "Error updating PostImage.");
        }

        return new PostImageCommandResult
        {
            Success = true,
            PostImage = postImage
        };
    }

    public async Task<PostImageCommandResult> DeleteAsync(
        int actorUserId,
        bool actorIsAdmin,
        int postImageId,
        CancellationToken cancellationToken = default
    )
    {
        if (actorUserId < 1 || postImageId < 1)
        {
            return Failure(PostImageCommandFailureReason.InvalidRequest, "Invalid post image identifier.");
        }

        PostImage? postImage = await _postImages.FindAsync(postImageId, cancellationToken);
        if (postImage == null)
        {
            return Failure(PostImageCommandFailureReason.PostImageNotFound, $"PostImage with ID {postImageId} not found.");
        }

        Post? post = await _posts.FindAsync(postImage.PostID, cancellationToken);
        if (post == null)
        {
            return Failure(PostImageCommandFailureReason.PostNotFound, $"Post with ID {postImage.PostID} not found.");
        }

        if (post.IsDeleted)
        {
            return Failure(PostImageCommandFailureReason.PostDeleted, "Cannot delete images from a deleted post.");
        }

        if (post.UserID != actorUserId && !actorIsAdmin)
        {
            return Failure(PostImageCommandFailureReason.Forbidden, "You can only delete images from your own posts.");
        }

        bool deleted = await _postImages.DeletePostImageAsync(postImageId, cancellationToken);
        if (!deleted)
        {
            return Failure(PostImageCommandFailureReason.PersistenceFailed, "Error deleting PostImage.");
        }

        return new PostImageCommandResult
        {
            Success = true,
            PostImage = postImage
        };
    }

    private static PostImageCommandResult Failure(PostImageCommandFailureReason reason, string message)
    {
        return new PostImageCommandResult
        {
            Success = false,
            FailureReason = reason,
            Message = message
        };
    }

    private static DateTime NormalizeSqlDateTime(DateTime value, DateTime? fallback = null)
    {
        if (value == default || value < SqlDateTimeMinUtc)
        {
            return fallback ?? DateTime.UtcNow;
        }

        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
    }
}
