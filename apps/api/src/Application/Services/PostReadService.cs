using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Common;

namespace TijarahJo.Application.Services;

public sealed class PostReadService : IPostReadService
{
    private readonly IPostService _posts;

    public PostReadService(IPostService posts)
    {
        _posts = posts;
    }

    public async Task<PostReadResult> GetByIdAsync(int postId, CancellationToken cancellationToken = default)
    {
        if (postId < 1)
        {
            return new PostReadResult
            {
                Success = false,
                FailureReason = PostReadFailureReason.InvalidRequest,
                Message = $"Invalid post ID: {postId}"
            };
        }

        Post? post = await _posts.FindAsync(postId, cancellationToken);
        if (post == null || post.IsDeleted || PostStatusPolicy.IsModerationState(post.Status))
        {
            return new PostReadResult
            {
                Success = false,
                FailureReason = PostReadFailureReason.NotFound,
                Message = $"Post with ID {postId} not found."
            };
        }

        return new PostReadResult
        {
            Success = true,
            Post = post
        };
    }

    public async Task<PostExistsResult> ExistsAsync(int postId, CancellationToken cancellationToken = default)
    {
        if (postId < 1)
        {
            return new PostExistsResult
            {
                Success = false,
                FailureReason = PostReadFailureReason.InvalidRequest,
                Message = $"Not accepted ID {postId}"
            };
        }

        bool exists = await _posts.DoesPostExistAsync(postId, cancellationToken);
        return new PostExistsResult
        {
            Success = true,
            Exists = exists
        };
    }

    public async Task<PostReadCollectionResult> GetByUserIdAsync(int userId, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
    {
        if (userId < 1)
        {
            return new PostReadCollectionResult
            {
                Success = false,
                FailureReason = PostReadFailureReason.InvalidRequest,
                Message = $"Invalid user ID {userId}"
            };
        }

        IReadOnlyList<PostModel> posts = await _posts.GetPostsByUserIdAsync(userId, pageNumber, pageSize, cancellationToken);
        List<PostModel> publicVisiblePosts = posts
            .Where(IsPubliclyVisible)
            .ToList();

        return new PostReadCollectionResult
        {
            Success = true,
            Posts = publicVisiblePosts
        };
    }

    public async Task<PostReadCollectionResult> GetByCategoryIdAsync(int categoryId, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
    {
        if (categoryId < 1)
        {
            return new PostReadCollectionResult
            {
                Success = false,
                FailureReason = PostReadFailureReason.InvalidRequest,
                Message = $"Invalid category ID {categoryId}"
            };
        }

        IReadOnlyList<PostModel> posts = await _posts.GetPostsByCategoryIdAsync(categoryId, pageNumber, pageSize, cancellationToken);
        List<PostModel> publicVisiblePosts = posts
            .Where(IsPubliclyVisible)
            .ToList();

        return new PostReadCollectionResult
        {
            Success = true,
            Posts = publicVisiblePosts
        };
    }

    public async Task<PostViewIncrementResult> IncrementViewsAsync(int postId, CancellationToken cancellationToken = default)
    {
        if (postId < 1)
        {
            return new PostViewIncrementResult
            {
                Success = false,
                FailureReason = PostReadFailureReason.InvalidRequest,
                Message = $"Invalid post ID: {postId}"
            };
        }

        // Use DoesPostExistAsync instead of FindAsync — avoids loading the full entity
        // just to check existence before incrementing the view counter.
        bool exists = await _posts.DoesPostExistAsync(postId, cancellationToken);
        if (!exists)
        {
            return new PostViewIncrementResult
            {
                Success = false,
                FailureReason = PostReadFailureReason.NotFound,
                Message = $"Post with ID {postId} not found."
            };
        }

        bool updated = await _posts.IncrementViewsAsync(postId, cancellationToken);
        if (!updated)
        {
            return new PostViewIncrementResult
            {
                Success = false,
                FailureReason = PostReadFailureReason.PersistenceFailed,
                Message = "Error incrementing view count"
            };
        }

        return new PostViewIncrementResult
        {
            Success = true
        };
    }

    private static bool IsPubliclyVisible(PostModel post)
    {
        if (post.IsDeleted)
        {
            return false;
        }

        if (post.Status == PostStatusPolicy.Blocked)
        {
            return false;
        }

        return post.Status == PostStatusPolicy.Active || post.Status == PostStatusPolicy.Sold;
    }
}
