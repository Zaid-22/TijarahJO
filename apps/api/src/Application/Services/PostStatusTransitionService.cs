using System.Threading;
using System.Threading.Tasks;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Common;

namespace TijarahJo.Application.Services;

public sealed class PostStatusTransitionService : IPostStatusTransitionService
{
    private readonly IPostService _posts;

    public PostStatusTransitionService(IPostService posts)
    {
        _posts = posts;
    }

    public async Task<PostStatusUpdateResult> UpdateStatusAsync(
        int postId,
        int actorUserId,
        bool actorIsAdmin,
        string? requestedStatus,
        CancellationToken cancellationToken = default
    )
    {
        if (postId < 1 || actorUserId < 1 || string.IsNullOrWhiteSpace(requestedStatus))
        {
            return new PostStatusUpdateResult
            {
                Success = false,
                FailureReason = PostStatusUpdateFailureReason.InvalidRequest,
                Message = "Invalid request data."
            };
        }

        if (!PostStatusPolicy.TryParseApiStatus(requestedStatus, out int targetStatus))
        {
            return new PostStatusUpdateResult
            {
                Success = false,
                FailureReason = PostStatusUpdateFailureReason.InvalidStatus,
                Message = $"Invalid status. Allowed values: {PostStatusPolicy.AllowedApiStatuses}."
            };
        }

        Post? post = await _posts.FindAsync(postId, cancellationToken);
        if (post == null)
        {
            return new PostStatusUpdateResult
            {
                Success = false,
                FailureReason = PostStatusUpdateFailureReason.PostNotFound,
                Message = $"Post with ID {postId} not found."
            };
        }

        if (post.UserID != actorUserId && !actorIsAdmin)
        {
            return new PostStatusUpdateResult
            {
                Success = false,
                FailureReason = PostStatusUpdateFailureReason.Forbidden,
                Message = "You can only update the status of your own posts."
            };
        }

        if (!actorIsAdmin)
        {
            if (PostStatusPolicy.IsModerationState(targetStatus))
            {
                return new PostStatusUpdateResult
                {
                    Success = false,
                    FailureReason = PostStatusUpdateFailureReason.Forbidden,
                    Message = "Only admins can set blocked status."
                };
            }

            if (PostStatusPolicy.IsModerationState(post.Status) && targetStatus != post.Status)
            {
                return new PostStatusUpdateResult
                {
                    Success = false,
                    FailureReason = PostStatusUpdateFailureReason.Forbidden,
                    Message = "Only admins can reactivate blocked posts."
                };
            }
        }

        if (post.Status == targetStatus)
        {
            return new PostStatusUpdateResult
            {
                Success = true,
                Post = post
            };
        }

        post.Status = targetStatus;
        bool saved = await _posts.SaveAsync(post, cancellationToken);
        if (!saved)
        {
            return new PostStatusUpdateResult
            {
                Success = false,
                FailureReason = PostStatusUpdateFailureReason.PersistenceFailed,
                Message = "Error updating post status."
            };
        }

        return new PostStatusUpdateResult
        {
            Success = true,
            Post = post
        };
    }
}
