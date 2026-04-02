using System;
using System.Threading;
using System.Threading.Tasks;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Domain.Models;

namespace TijarahJo.Application.Services;

public sealed class PostCommentService(IPostCommentDataAccess commentDataAccess, IPostDataAccess postDataAccess) : IPostCommentService
{
    private readonly IPostCommentDataAccess _commentDataAccess = commentDataAccess;
    private readonly IPostDataAccess _postDataAccess = postDataAccess;

    // Rate limit: max 5 comments per user per minute
    private const int RateLimitMaxComments = 5;
    private static readonly TimeSpan RateLimitWindow = TimeSpan.FromMinutes(1);
    private const int MaxContentLength = 2000;

    public async Task<PostCommentResult> AddCommentAsync(
        int postId, int userId, string? content, int? parentCommentId = null, CancellationToken cancellationToken = default)
    {
        // Validate content
        if (string.IsNullOrWhiteSpace(content))
        {
            return new PostCommentResult
            {
                Success = false,
                FailureReason = PostCommentFailureReason.InvalidRequest,
                Message = "Comment content is required."
            };
        }

        string trimmedContent = content.Trim();
        if (trimmedContent.Length > MaxContentLength)
        {
            return new PostCommentResult
            {
                Success = false,
                FailureReason = PostCommentFailureReason.InvalidRequest,
                Message = $"Comment content must not exceed {MaxContentLength} characters."
            };
        }

        // Verify post exists
        bool postExists = await _postDataAccess.DoesPostExistAsync(postId, cancellationToken);
        if (!postExists)
        {
            return new PostCommentResult
            {
                Success = false,
                FailureReason = PostCommentFailureReason.PostNotFound,
                Message = "Post not found."
            };
        }

        // If reply, verify parent comment exists
        if (parentCommentId.HasValue)
        {
            var parentComment = await _commentDataAccess.GetCommentByIdAsync(parentCommentId.Value, cancellationToken);
            if (parentComment == null)
            {
                return new PostCommentResult
                {
                    Success = false,
                    FailureReason = PostCommentFailureReason.CommentNotFound,
                    Message = "Parent comment not found."
                };
            }

            // Ensure parent belongs to the same post
            if (parentComment.PostID != postId)
            {
                return new PostCommentResult
                {
                    Success = false,
                    FailureReason = PostCommentFailureReason.InvalidRequest,
                    Message = "Parent comment does not belong to this post."
                };
            }

            // Only allow one level of nesting: replies to top-level comments only
            if (parentComment.ParentCommentID != null)
            {
                return new PostCommentResult
                {
                    Success = false,
                    FailureReason = PostCommentFailureReason.InvalidRequest,
                    Message = "Nested replies beyond one level are not supported."
                };
            }
        }

        // Rate limiting
        int recentCount = await _commentDataAccess.GetRecentCommentCountAsync(userId, RateLimitWindow, cancellationToken);
        if (recentCount >= RateLimitMaxComments)
        {
            return new PostCommentResult
            {
                Success = false,
                FailureReason = PostCommentFailureReason.RateLimited,
                Message = "You are posting comments too frequently. Please wait a moment before trying again."
            };
        }

        // Create the comment
        var model = new PostCommentModel
        {
            PostID = postId,
            UserID = userId,
            ParentCommentID = parentCommentId,
            Content = trimmedContent
        };

        try
        {
            int commentId = await _commentDataAccess.AddCommentAsync(model, cancellationToken);
            var created = await _commentDataAccess.GetCommentByIdAsync(commentId, cancellationToken);

            return new PostCommentResult
            {
                Success = true,
                Comment = created
            };
        }
        catch
        {
            return new PostCommentResult
            {
                Success = false,
                FailureReason = PostCommentFailureReason.PersistenceFailed,
                Message = "Failed to save comment."
            };
        }
    }

    public async Task<PostCommentListResult> GetTopLevelCommentsAsync(
        int postId, int pageNumber = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        if (postId < 1)
        {
            return new PostCommentListResult
            {
                Success = false,
                FailureReason = PostCommentFailureReason.InvalidRequest,
                Message = "Invalid post ID."
            };
        }

        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var comments = await _commentDataAccess.GetTopLevelCommentsByPostIdAsync(postId, pageNumber, pageSize, cancellationToken);
        int totalCount = await _commentDataAccess.GetCommentCountByPostIdAsync(postId, cancellationToken);

        return new PostCommentListResult
        {
            Success = true,
            Comments = comments,
            TotalCount = totalCount
        };
    }

    public async Task<PostCommentListResult> GetRepliesAsync(
        int parentCommentId, int pageNumber = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        if (parentCommentId < 1)
        {
            return new PostCommentListResult
            {
                Success = false,
                FailureReason = PostCommentFailureReason.InvalidRequest,
                Message = "Invalid parent comment ID."
            };
        }

        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var replies = await _commentDataAccess.GetRepliesByParentIdAsync(parentCommentId, pageNumber, pageSize, cancellationToken);

        return new PostCommentListResult
        {
            Success = true,
            Comments = replies,
            TotalCount = replies.Count
        };
    }

    public async Task<PostCommentResult> UpdateCommentAsync(
        int commentId, int actorUserId, string? content, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            return new PostCommentResult
            {
                Success = false,
                FailureReason = PostCommentFailureReason.InvalidRequest,
                Message = "Comment content is required."
            };
        }

        string trimmedContent = content.Trim();
        if (trimmedContent.Length > MaxContentLength)
        {
            return new PostCommentResult
            {
                Success = false,
                FailureReason = PostCommentFailureReason.InvalidRequest,
                Message = $"Comment content must not exceed {MaxContentLength} characters."
            };
        }

        var existing = await _commentDataAccess.GetCommentByIdAsync(commentId, cancellationToken);
        if (existing == null)
        {
            return new PostCommentResult
            {
                Success = false,
                FailureReason = PostCommentFailureReason.CommentNotFound,
                Message = "Comment not found."
            };
        }

        // Only the comment author can edit
        if (existing.UserID != actorUserId)
        {
            return new PostCommentResult
            {
                Success = false,
                FailureReason = PostCommentFailureReason.Forbidden,
                Message = "You can only edit your own comments."
            };
        }

        bool updated = await _commentDataAccess.UpdateCommentAsync(commentId, trimmedContent, cancellationToken);
        if (!updated)
        {
            return new PostCommentResult
            {
                Success = false,
                FailureReason = PostCommentFailureReason.PersistenceFailed,
                Message = "Failed to update comment."
            };
        }

        var refreshed = await _commentDataAccess.GetCommentByIdAsync(commentId, cancellationToken);
        return new PostCommentResult { Success = true, Comment = refreshed };
    }

    public async Task<PostCommentResult> DeleteCommentAsync(
        int commentId, int actorUserId, bool actorIsAdmin, int? postOwnerId = null, CancellationToken cancellationToken = default)
    {
        var existing = await _commentDataAccess.GetCommentByIdAsync(commentId, cancellationToken);
        if (existing == null)
        {
            return new PostCommentResult
            {
                Success = false,
                FailureReason = PostCommentFailureReason.CommentNotFound,
                Message = "Comment not found."
            };
        }

        // Authorization: comment author, post owner, or admin
        bool isCommentAuthor = existing.UserID == actorUserId;
        bool isPostOwner = postOwnerId.HasValue && postOwnerId.Value == actorUserId;
        if (!isCommentAuthor && !isPostOwner && !actorIsAdmin)
        {
            return new PostCommentResult
            {
                Success = false,
                FailureReason = PostCommentFailureReason.Forbidden,
                Message = "You do not have permission to delete this comment."
            };
        }

        bool deleted = await _commentDataAccess.DeleteCommentAsync(commentId, actorUserId, cancellationToken);
        if (!deleted)
        {
            return new PostCommentResult
            {
                Success = false,
                FailureReason = PostCommentFailureReason.PersistenceFailed,
                Message = "Failed to delete comment."
            };
        }

        return new PostCommentResult { Success = true, Comment = existing };
    }
}
