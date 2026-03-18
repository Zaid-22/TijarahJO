using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Common;
using TijarahJo.Application.Services;

namespace TijarahJo.Api.Tests;

public sealed class PostReadServiceTests
{
    [Fact]
    public async Task ExistsAsync_ReturnsInvalidRequest_ForNonPositiveId()
    {
        var posts = new FakePostService();
        var service = new PostReadService(posts);

        PostExistsResult result = await service.ExistsAsync(0);

        Assert.False(result.Success);
        Assert.Equal(PostReadFailureReason.InvalidRequest, result.FailureReason);
        Assert.Equal(0, posts.DoesPostExistAsyncCalls);
    }

    [Fact]
    public async Task GetByUserIdAsync_FiltersDeletedPosts()
    {
        var posts = new FakePostService
        {
            UserPosts = new List<PostModel>
            {
                BuildPost(postId: 1, userId: 10, isDeleted: false),
                BuildPost(postId: 2, userId: 10, isDeleted: true)
            }
        };
        var service = new PostReadService(posts);

        PostReadCollectionResult result = await service.GetByUserIdAsync(10);

        Assert.True(result.Success);
        Assert.Single(result.Posts);
        Assert.Equal(1, result.Posts[0].PostID);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNotFound_WhenPostIsSoftDeleted()
    {
        var deletedPost = new Post(BuildPost(postId: 77, userId: 3, isDeleted: true), Post.ModeType.Update);
        var posts = new FakePostService { FindAsyncResult = deletedPost };
        var service = new PostReadService(posts);

        PostReadResult result = await service.GetByIdAsync(77);

        Assert.False(result.Success);
        Assert.Equal(PostReadFailureReason.NotFound, result.FailureReason);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNotFound_WhenPostIsBlockedForPublicRead()
    {
        var blockedPost = new Post(
            BuildPost(postId: 88, userId: 3, isDeleted: false, status: PostStatusPolicy.Blocked),
            Post.ModeType.Update
        );
        var posts = new FakePostService { FindAsyncResult = blockedPost };
        var service = new PostReadService(posts);

        PostReadResult result = await service.GetByIdAsync(88);

        Assert.False(result.Success);
        Assert.Equal(PostReadFailureReason.NotFound, result.FailureReason);
    }

    [Fact]
    public async Task IncrementViewsAsync_ReturnsPersistenceFailed_WhenStoreUpdateFails()
    {
        var activePost = new Post(BuildPost(postId: 9, userId: 4, isDeleted: false), Post.ModeType.Update);
        var posts = new FakePostService
        {
            FindAsyncResult = activePost,
            DoesPostExistAsyncResult = true, // Simulate database existence check passing
            IncrementViewsAsyncResult = false
        };
        var service = new PostReadService(posts);

        PostViewIncrementResult result = await service.IncrementViewsAsync(9);

        Assert.False(result.Success);
        Assert.Equal(PostReadFailureReason.PersistenceFailed, result.FailureReason);
    }

    private static PostModel BuildPost(int postId, int userId, bool isDeleted, int status = PostStatusPolicy.Active)
        => new(
            postId,
            userId,
            1,
            "title",
            "desc",
            5m,
            status,
            DateTime.UtcNow,
            isDeleted,
            0L,
            null,
            null
        );

    private sealed class FakePostService : IPostService
    {
        public Post? FindAsyncResult { get; set; }
        public bool DoesPostExistAsyncResult { get; set; }
        public IReadOnlyList<PostModel> UserPosts { get; set; } = Array.Empty<PostModel>();
        public IReadOnlyList<PostModel> CategoryPosts { get; set; } = Array.Empty<PostModel>();
        public bool IncrementViewsAsyncResult { get; set; } = true;
        public int DoesPostExistAsyncCalls { get; private set; }

        public Task<Post?> FindAsync(int? postId, CancellationToken cancellationToken = default)
            => Task.FromResult(FindAsyncResult);

        public Post Create(PostModel model)
            => new(model);

        public Task<bool> SaveAsync(Post post, CancellationToken cancellationToken = default)
            => Task.FromResult(true);

        public Task<bool> DeletePostAsync(int? postId, int actorUserId, CancellationToken cancellationToken = default)
            => Task.FromResult(true);

        public Task<bool> DoesPostExistAsync(int? postId, CancellationToken cancellationToken = default)
        {
            DoesPostExistAsyncCalls++;
            return Task.FromResult(DoesPostExistAsyncResult);
        }

        public Task<bool> IncrementViewsAsync(int? postId, CancellationToken cancellationToken = default)
            => Task.FromResult(IncrementViewsAsyncResult);

        public Task<IReadOnlyList<PostModel>> GetPostsByUserIdAsync(int userId, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<PostModel>>(UserPosts.Where(p => !p.IsDeleted).ToList());

        public Task<IReadOnlyList<PostModel>> GetPostsByCategoryIdAsync(int categoryId, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<PostModel>>(CategoryPosts.Where(p => !p.IsDeleted).ToList());
    }
}
