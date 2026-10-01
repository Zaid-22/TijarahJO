using Microsoft.Extensions.Logging.Abstractions;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Common;
using TijarahJo.Application.Services;
using TijarahJo.Domain.Models;

namespace TijarahJo.Api.Tests;

public sealed class PostCommentServiceTests
{
    [Fact]
    public async Task GetTopLevelCommentsAsync_HidesComments_WhenPostIsNotPublic()
    {
        var comments = new FakePostCommentDataAccess();
        var service = BuildService(comments, postIsPublic: false);

        PostCommentListResult result = await service.GetTopLevelCommentsAsync(10);

        Assert.False(result.Success);
        Assert.Equal(PostCommentFailureReason.PostNotFound, result.FailureReason);
        Assert.Equal(0, comments.TopLevelCalls);
    }

    [Fact]
    public async Task AddCommentAsync_RejectsComment_WhenPostIsNotPublic()
    {
        var comments = new FakePostCommentDataAccess();
        var service = BuildService(comments, postIsPublic: false);

        PostCommentResult result = await service.AddCommentAsync(10, 7, "Hello");

        Assert.False(result.Success);
        Assert.Equal(PostCommentFailureReason.PostNotFound, result.FailureReason);
        Assert.Equal(0, comments.AddCalls);
    }

    [Fact]
    public async Task AddCommentAsync_DoesNotExposePersistenceExceptionDetails()
    {
        var comments = new FakePostCommentDataAccess { ThrowOnAdd = true };
        var service = BuildService(comments, postIsPublic: true);

        PostCommentResult result = await service.AddCommentAsync(10, 7, "Hello");

        Assert.False(result.Success);
        Assert.Equal(PostCommentFailureReason.PersistenceFailed, result.FailureReason);
        Assert.Equal("Failed to save comment.", result.Message);
        Assert.DoesNotContain("database-secret", result.Message, StringComparison.Ordinal);
    }

    private static PostCommentService BuildService(
        FakePostCommentDataAccess comments,
        bool postIsPublic)
    {
        return new PostCommentService(
            comments,
            new FakePostReadService(postIsPublic),
            NullLogger<PostCommentService>.Instance);
    }

    private sealed class FakePostReadService(bool postIsPublic) : IPostReadService
    {
        public Task<PostReadResult> GetByIdAsync(int postId, CancellationToken cancellationToken = default)
        {
            if (!postIsPublic)
            {
                return Task.FromResult(new PostReadResult
                {
                    Success = false,
                    FailureReason = PostReadFailureReason.NotFound
                });
            }

            var post = new Post(
                new PostModel(postId, 1, 1, "Post", "Description", 1m, PostStatusPolicy.Active, DateTime.UtcNow, false),
                Post.ModeType.Update);
            return Task.FromResult(new PostReadResult { Success = true, Post = post });
        }

        public Task<PostExistsResult> ExistsAsync(int postId, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<PostReadCollectionResult> GetByUserIdAsync(int userId, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<PostReadCollectionResult> GetByCategoryIdAsync(int categoryId, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<PostViewIncrementResult> IncrementViewsAsync(int postId, CancellationToken cancellationToken = default) => throw new NotSupportedException();
    }

    private sealed class FakePostCommentDataAccess : IPostCommentDataAccess
    {
        public bool ThrowOnAdd { get; init; }
        public int AddCalls { get; private set; }
        public int TopLevelCalls { get; private set; }

        public Task<int> AddCommentAsync(PostCommentModel comment, CancellationToken cancellationToken = default)
        {
            AddCalls++;
            if (ThrowOnAdd)
            {
                throw new InvalidOperationException("database-secret");
            }

            return Task.FromResult(1);
        }

        public Task<IReadOnlyList<PostCommentModel>> GetTopLevelCommentsByPostIdAsync(int postId, int pageNumber = 1, int pageSize = 20, CancellationToken cancellationToken = default)
        {
            TopLevelCalls++;
            return Task.FromResult<IReadOnlyList<PostCommentModel>>([]);
        }

        public Task<IReadOnlyList<PostCommentModel>> GetRepliesByParentIdAsync(int parentCommentId, int pageNumber = 1, int pageSize = 20, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<PostCommentModel>>([]);

        public Task<PostCommentModel?> GetCommentByIdAsync(int commentId, CancellationToken cancellationToken = default)
            => Task.FromResult<PostCommentModel?>(new PostCommentModel { CommentID = commentId, PostID = 10, UserID = 7, Content = "Hello" });

        public Task<bool> UpdateCommentAsync(int commentId, string content, CancellationToken cancellationToken = default)
            => Task.FromResult(true);

        public Task<bool> DeleteCommentAsync(int commentId, int actorUserId, CancellationToken cancellationToken = default)
            => Task.FromResult(true);

        public Task<int> GetRecentCommentCountAsync(int userId, TimeSpan window, CancellationToken cancellationToken = default)
            => Task.FromResult(0);

        public Task<int> GetCommentCountByPostIdAsync(int postId, CancellationToken cancellationToken = default)
            => Task.FromResult(0);
    }
}
