using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.DataAccess;
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
        var service = CreateService(posts);

        PostExistsResult result = await service.ExistsAsync(0);

        Assert.False(result.Success);
        Assert.Equal(PostReadFailureReason.InvalidRequest, result.FailureReason);
        Assert.Equal(0, posts.FindAsyncCalls);
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
        var service = CreateService(posts);

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
        var service = CreateService(posts);

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
        var service = CreateService(posts);

        PostReadResult result = await service.GetByIdAsync(88);

        Assert.False(result.Success);
        Assert.Equal(PostReadFailureReason.NotFound, result.FailureReason);
    }

    [Fact]
    public async Task ExistsAsync_ReturnsFalse_WhenPostIsBlocked()
    {
        var blockedPost = new Post(
            BuildPost(postId: 88, userId: 3, isDeleted: false, status: PostStatusPolicy.Blocked),
            Post.ModeType.Update);
        var service = CreateService(new FakePostService { FindAsyncResult = blockedPost });

        PostExistsResult result = await service.ExistsAsync(88);

        Assert.True(result.Success);
        Assert.False(result.Exists);
    }

    [Fact]
    public async Task IncrementViewsAsync_ReturnsNotFound_WhenPostIsBlocked()
    {
        var blockedPost = new Post(
            BuildPost(postId: 88, userId: 3, isDeleted: false, status: PostStatusPolicy.Blocked),
            Post.ModeType.Update);
        var posts = new FakePostService { FindAsyncResult = blockedPost };
        var service = CreateService(posts);

        PostViewIncrementResult result = await service.IncrementViewsAsync(88);

        Assert.False(result.Success);
        Assert.Equal(PostReadFailureReason.NotFound, result.FailureReason);
        Assert.Equal(0, posts.IncrementViewsAsyncCalls);
    }

    [Fact]
    public async Task IncrementViewsAsync_ReturnsPersistenceFailed_WhenStoreUpdateFails()
    {
        var activePost = new Post(BuildPost(postId: 9, userId: 4, isDeleted: false), Post.ModeType.Update);
        var posts = new FakePostService
        {
            FindAsyncResult = activePost,
            IncrementViewsAsyncResult = false
        };
        var service = CreateService(posts);

        PostViewIncrementResult result = await service.IncrementViewsAsync(9);

        Assert.False(result.Success);
        Assert.Equal(PostReadFailureReason.PersistenceFailed, result.FailureReason);
    }

    [Theory]
    [InlineData(UserStatusPolicy.Banned, false)]
    [InlineData(UserStatusPolicy.Inactive, false)]
    [InlineData(UserStatusPolicy.Active, true)]
    public async Task GetByIdAsync_ReturnsNotFound_WhenSellerIsNotPubliclyVisible(int status, bool isDeleted)
    {
        var post = new Post(BuildPost(postId: 9, userId: 4, isDeleted: false), Post.ModeType.Update);
        var posts = new FakePostService { FindAsyncResult = post };
        var service = CreateService(posts, status, isDeleted);

        PostReadResult result = await service.GetByIdAsync(9);

        Assert.False(result.Success);
        Assert.Equal(PostReadFailureReason.NotFound, result.FailureReason);
    }

    [Fact]
    public async Task GetByUserIdAsync_ReturnsNoPosts_WhenSellerIsInactive()
    {
        var posts = new FakePostService
        {
            UserPosts = [BuildPost(postId: 1, userId: 10, isDeleted: false)]
        };
        var service = CreateService(posts, UserStatusPolicy.Inactive);

        PostReadCollectionResult result = await service.GetByUserIdAsync(10);

        Assert.True(result.Success);
        Assert.Empty(result.Posts);
    }

    private static PostReadService CreateService(
        IPostService posts,
        int sellerStatus = UserStatusPolicy.Active,
        bool sellerIsDeleted = false)
    {
        return new PostReadService(posts, new FakeUserDataAccess(new UserModel(
            userid: 10,
            hashedpassword: "hashed-password",
            email: "seller@example.com",
            firstname: "Test",
            lastname: "Seller",
            phone: null,
            cityId: null,
            areaId: null,
            bio: null,
            avatar: null,
            joindate: DateTime.UtcNow,
            status: sellerStatus,
            roleid: 2,
            isdeleted: sellerIsDeleted)));
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
        public IReadOnlyList<PostModel> UserPosts { get; set; } = Array.Empty<PostModel>();
        public IReadOnlyList<PostModel> CategoryPosts { get; set; } = Array.Empty<PostModel>();
        public bool IncrementViewsAsyncResult { get; set; } = true;
        public int FindAsyncCalls { get; private set; }
        public int IncrementViewsAsyncCalls { get; private set; }

        public Task<Post?> FindAsync(int? postId, CancellationToken cancellationToken = default)
        {
            FindAsyncCalls++;
            return Task.FromResult(FindAsyncResult);
        }

        public Post Create(PostModel model)
            => new(model);

        public Task<bool> SaveAsync(Post post, CancellationToken cancellationToken = default)
            => Task.FromResult(true);

        public Task<bool> DeletePostAsync(int? postId, int actorUserId, CancellationToken cancellationToken = default)
            => Task.FromResult(true);

        public Task<bool> DoesPostExistAsync(int? postId, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();

        public Task<bool> IncrementViewsAsync(int? postId, CancellationToken cancellationToken = default)
        {
            IncrementViewsAsyncCalls++;
            return Task.FromResult(IncrementViewsAsyncResult);
        }

        public Task<IReadOnlyList<PostModel>> GetPostsByUserIdAsync(int userId, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<PostModel>>(UserPosts.Where(p => !p.IsDeleted).ToList());

        public Task<IReadOnlyList<PostModel>> GetPostsByCategoryIdAsync(int categoryId, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<PostModel>>(CategoryPosts.Where(p => !p.IsDeleted).ToList());
    }

    private sealed class FakeUserDataAccess(UserModel seller) : IUserDataAccess
    {
        public Task<UserModel?> GetUserByIDAsync(int? userId, CancellationToken cancellationToken = default)
            => Task.FromResult<UserModel?>(seller with { UserID = userId });

        public Task<int> AddUserAsync(UserModel user, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();

        public Task<bool> UpdateUserFieldsAsync(
            UserModel user,
            int actorUserId,
            UserUpdateFields fields,
            CancellationToken cancellationToken = default)
            => throw new NotSupportedException();

        public Task<bool> DeleteUserAsync(int? userId, int actorUserId, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();

        public Task<bool> DoesUserExistAsync(int? userId, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();

        public Task<IReadOnlyList<UserModel>> GetAllUsersAsync(
            int pageNumber = 1,
            int pageSize = 50,
            CancellationToken cancellationToken = default)
            => throw new NotSupportedException();

        public Task<UserModel?> GetUserByLoginAsync(string login, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();

        public Task<UserModel?> GetUserByLoginCandidatesAsync(
            IReadOnlyList<string> candidates,
            CancellationToken cancellationToken = default)
            => throw new NotSupportedException();
    }
}
