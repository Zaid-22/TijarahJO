using TijarahJo.Domain.Models;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.Application.Common;
using TijarahJoDB.BLL;

namespace TijarahJoDB.Application.Services;

public sealed class PostMutationService : IPostMutationService
{
    private readonly IPostService _posts;

    public PostMutationService(IPostService posts)
    {
        _posts = posts;
    }

    public async Task<PostMutationResult> CreateAsync(CreatePostCommand command, CancellationToken cancellationToken = default)
    {
        if (!IsValidCreateCommand(command, out string? invalidMessage))
        {
            return Failure(PostMutationFailureReason.InvalidRequest, invalidMessage ?? "Invalid post data.");
        }

        Post post = _posts.Create(new PostModel(
            null,
            command.ActorUserId,
            command.CategoryId,
            command.Title!.Trim(),
            string.IsNullOrWhiteSpace(command.Description) ? string.Empty : command.Description.Trim(),
            command.Price,
            PostStatusPolicy.Active,
            DateTime.UtcNow,
            false,
            0,
            command.CityId,
            command.AreaId
        ));

        bool saved = await _posts.SaveAsync(post, cancellationToken);
        if (!saved)
        {
            return Failure(PostMutationFailureReason.PersistenceFailed, "Error adding post.");
        }

        return new PostMutationResult
        {
            Success = true,
            Post = post
        };
    }

    public async Task<PostMutationResult> UpdateAsync(UpdatePostCommand command, CancellationToken cancellationToken = default)
    {
        if (!IsValidUpdateCommand(command, out string? invalidMessage))
        {
            return Failure(PostMutationFailureReason.InvalidRequest, invalidMessage ?? "Invalid post data.");
        }

        Post? post = await _posts.FindAsync(command.PostId, cancellationToken);
        if (post == null)
        {
            return Failure(PostMutationFailureReason.NotFound, $"Post with ID {command.PostId} not found.");
        }

        if (post.UserID != command.ActorUserId && !command.ActorIsAdmin)
        {
            return Failure(PostMutationFailureReason.Forbidden, "You can only update your own posts.");
        }

        post.CategoryID = command.CategoryId;
        post.PostTitle = command.Title!.Trim();
        post.PostDescription = string.IsNullOrWhiteSpace(command.Description) ? string.Empty : command.Description.Trim();
        post.Price = command.Price;
        post.CityId = command.CityId;
        post.AreaId = command.AreaId;

        bool saved = await _posts.SaveAsync(post, cancellationToken);
        if (!saved)
        {
            return Failure(PostMutationFailureReason.PersistenceFailed, "Error updating post.");
        }

        return new PostMutationResult
        {
            Success = true,
            Post = post
        };
    }

    public async Task<PostMutationResult> DeleteAsync(int postId, int actorUserId, bool actorIsAdmin, CancellationToken cancellationToken = default)
    {
        if (postId < 1 || actorUserId < 1)
        {
            return Failure(PostMutationFailureReason.InvalidRequest, "Invalid post identifier.");
        }

        Post? post = await _posts.FindAsync(postId, cancellationToken);
        if (post == null)
        {
            return Failure(PostMutationFailureReason.NotFound, $"Post with ID {postId} not found.");
        }

        if (post.UserID != actorUserId && !actorIsAdmin)
        {
            return Failure(PostMutationFailureReason.Forbidden, "You can only delete your own posts.");
        }

        bool deleted = await _posts.DeletePostAsync(postId, actorUserId, cancellationToken);
        if (!deleted)
        {
            return Failure(PostMutationFailureReason.PersistenceFailed, "Failed to delete post.");
        }

        return new PostMutationResult
        {
            Success = true,
            Post = post
        };
    }

    private static bool IsValidCreateCommand(CreatePostCommand command, out string? invalidMessage)
    {
        invalidMessage = null;

        if (command.ActorUserId < 1 || command.CategoryId < 1 || string.IsNullOrWhiteSpace(command.Title))
        {
            invalidMessage = "Invalid post data.";
            return false;
        }

        if (command.AreaId.HasValue && !command.CityId.HasValue)
        {
            invalidMessage = "CityId is required when AreaId is provided.";
            return false;
        }

        return true;
    }

    private static bool IsValidUpdateCommand(UpdatePostCommand command, out string? invalidMessage)
    {
        invalidMessage = null;

        if (command.ActorUserId < 1 || command.PostId < 1 || command.CategoryId < 1 || string.IsNullOrWhiteSpace(command.Title))
        {
            invalidMessage = "Invalid post data.";
            return false;
        }

        if (command.AreaId.HasValue && !command.CityId.HasValue)
        {
            invalidMessage = "CityId is required when AreaId is provided.";
            return false;
        }

        return true;
    }

    private static PostMutationResult Failure(PostMutationFailureReason reason, string message)
    {
        return new PostMutationResult
        {
            Success = false,
            FailureReason = reason,
            Message = message
        };
    }
}
