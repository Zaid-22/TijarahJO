using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Services;
using TijarahJo.Application.Common;

namespace TijarahJo.Api.Tests;

/// <summary>
/// Unit tests for <see cref="PostMutationService"/>.
/// Uses in-process fakes — no database required.
/// </summary>
public sealed class PostMutationServiceTests
{
    // -------------------------------------------------------------------------
    // CreateAsync
    // -------------------------------------------------------------------------

    [Fact]
    public async Task CreateAsync_ReturnsInvalidRequest_WhenTitleMissing()
    {
        var service = BuildService();

        PostMutationResult result = await service.CreateAsync(new CreatePostCommand
        {
            ActorUserId = 1,
            CategoryId = 1,
            Title = "",
            CityId = 1,
            AreaId = 1
        });

        Assert.False(result.Success);
        Assert.Equal(PostMutationFailureReason.InvalidRequest, result.FailureReason);
    }

    [Fact]
    public async Task CreateAsync_ReturnsInvalidRequest_WhenCategoryIdInvalid()
    {
        var service = BuildService();

        PostMutationResult result = await service.CreateAsync(new CreatePostCommand
        {
            ActorUserId = 1,
            CategoryId = 0,
            Title = "Test Post",
            CityId = 1,
            AreaId = 1
        });

        Assert.False(result.Success);
        Assert.Equal(PostMutationFailureReason.InvalidRequest, result.FailureReason);
    }

    [Fact]
    public async Task CreateAsync_ReturnsInvalidRequest_WhenCityIdIsInvalid()
    {
        var service = BuildService();

        PostMutationResult result = await service.CreateAsync(new CreatePostCommand
        {
            ActorUserId = 1,
            CategoryId = 1,
            Title = "Test Post",
            AreaId = 5,
            CityId = 0
        });

        Assert.False(result.Success);
        Assert.Equal(PostMutationFailureReason.InvalidRequest, result.FailureReason);
    }

    [Fact]
    public async Task CreateAsync_ReturnsSuccess_WithValidData()
    {
        var service = BuildService();

        PostMutationResult result = await service.CreateAsync(new CreatePostCommand
        {
            ActorUserId = 1,
            CategoryId = 1,
            Title = "Test Post",
            Description = "A description",
            Price = 100m,
            CityId = 1,
            AreaId = 1
        });

        Assert.True(result.Success);
        Assert.NotNull(result.Post);
    }

    // -------------------------------------------------------------------------
    // UpdateAsync
    // -------------------------------------------------------------------------

    [Fact]
    public async Task UpdateAsync_ReturnsInvalidRequest_WhenTitleMissing()
    {
        var service = BuildService();

        PostMutationResult result = await service.UpdateAsync(new UpdatePostCommand
        {
            PostId = 1,
            ActorUserId = 1,
            CategoryId = 1,
            Title = "",
            CityId = 1,
            AreaId = 1
        });

        Assert.False(result.Success);
        Assert.Equal(PostMutationFailureReason.InvalidRequest, result.FailureReason);
    }

    [Fact]
    public async Task UpdateAsync_ReturnsNotFound_WhenPostDoesNotExist()
    {
        var service = BuildService(findPostReturnsNull: true);

        PostMutationResult result = await service.UpdateAsync(new UpdatePostCommand
        {
            PostId = 999,
            ActorUserId = 1,
            CategoryId = 1,
            Title = "Updated",
            CityId = 1,
            AreaId = 1
        });

        Assert.False(result.Success);
        Assert.Equal(PostMutationFailureReason.NotFound, result.FailureReason);
    }

    [Fact]
    public async Task UpdateAsync_ReturnsForbidden_WhenNonOwnerNonAdmin()
    {
        var service = BuildService();

        PostMutationResult result = await service.UpdateAsync(new UpdatePostCommand
        {
            PostId = 1,
            ActorUserId = 99, // Not the owner (owner is userId 1)
            ActorIsAdmin = false,
            CategoryId = 1,
            Title = "Hacked",
            CityId = 1,
            AreaId = 1
        });

        Assert.False(result.Success);
        Assert.Equal(PostMutationFailureReason.Forbidden, result.FailureReason);
    }

    [Fact]
    public async Task UpdateAsync_ReturnsSuccess_OwnerCanUpdate()
    {
        var service = BuildService();

        PostMutationResult result = await service.UpdateAsync(new UpdatePostCommand
        {
            PostId = 1,
            ActorUserId = 1,
            CategoryId = 2,
            Title = "Updated Title",
            Description = "Updated Description",
            CityId = 1,
            AreaId = 1
        });

        Assert.True(result.Success);
        Assert.NotNull(result.Post);
        Assert.Equal("Updated Title", result.Post!.PostTitle);
    }

    [Fact]
    public async Task UpdateAsync_ReturnsSuccess_AdminCanUpdateAnyPost()
    {
        var service = BuildService();

        PostMutationResult result = await service.UpdateAsync(new UpdatePostCommand
        {
            PostId = 1,
            ActorUserId = 99, // Not the owner, but admin
            ActorIsAdmin = true,
            CategoryId = 1,
            Title = "Admin Updated",
            CityId = 1,
            AreaId = 1
        });

        Assert.True(result.Success);
        Assert.NotNull(result.Post);
    }

    // -------------------------------------------------------------------------
    // DeleteAsync
    // -------------------------------------------------------------------------

    [Fact]
    public async Task DeleteAsync_ReturnsNotFound_WhenPostDoesNotExist()
    {
        var service = BuildService(findPostReturnsNull: true);

        PostMutationResult result = await service.DeleteAsync(postId: 999, actorUserId: 1, actorIsAdmin: false);

        Assert.False(result.Success);
        Assert.Equal(PostMutationFailureReason.NotFound, result.FailureReason);
    }

    [Fact]
    public async Task DeleteAsync_ReturnsForbidden_WhenNonOwnerNonAdmin()
    {
        var service = BuildService();

        PostMutationResult result = await service.DeleteAsync(postId: 1, actorUserId: 99, actorIsAdmin: false);

        Assert.False(result.Success);
        Assert.Equal(PostMutationFailureReason.Forbidden, result.FailureReason);
    }

    [Fact]
    public async Task DeleteAsync_ReturnsSuccess()
    {
        var service = BuildService();

        PostMutationResult result = await service.DeleteAsync(postId: 1, actorUserId: 1, actorIsAdmin: false);

        Assert.True(result.Success);
        Assert.NotNull(result.Post);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private static PostMutationService BuildService(bool findPostReturnsNull = false)
    {
        var posts = new FakePostService(findPostReturnsNull);
        var cache = new NullSearchCacheInvalidation();
        return new PostMutationService(posts, cache);
    }

    // -------------------------------------------------------------------------
    // Fakes
    // -------------------------------------------------------------------------

    private sealed class FakePostService(bool findReturnsNull = false) : IPostService
    {
        private readonly bool _findReturnsNull = findReturnsNull;

        private static readonly PostModel DefaultPostModel = new(
            postid: 1,
            userid: 1,
            categoryid: 1,
            posttitle: "Existing Post",
            postdescription: "Description",
            price: 50m,
            status: 1,
            createdat: DateTime.UtcNow,
            isdeleted: false,
            views: 0,
            cityId: 1,
            areaId: 1
        );

        public Task<Post?> FindAsync(int? postId, CancellationToken ct = default)
            => Task.FromResult<Post?>(_findReturnsNull ? null : new Post(DefaultPostModel, Post.ModeType.Update));

        public Post Create(PostModel model) => new(model);

        public Task<bool> SaveAsync(Post post, CancellationToken ct = default)
            => Task.FromResult(true);

        public Task<bool> DeletePostAsync(int? postId, int actorUserId, CancellationToken ct = default)
            => Task.FromResult(true);

        public Task<bool> DoesPostExistAsync(int? postId, CancellationToken ct = default)
            => Task.FromResult(!_findReturnsNull);

        public Task<bool> IncrementViewsAsync(int? postId, CancellationToken ct = default)
            => Task.FromResult(true);

        public Task<IReadOnlyList<PostModel>> GetPostsByUserIdAsync(int userId, int pageNumber = 1, int pageSize = 50, CancellationToken ct = default)
            => Task.FromResult<IReadOnlyList<PostModel>>([]);

        public Task<IReadOnlyList<PostModel>> GetPostsByCategoryIdAsync(int categoryId, int pageNumber = 1, int pageSize = 50, CancellationToken ct = default)
            => Task.FromResult<IReadOnlyList<PostModel>>([]);
    }

    private sealed class NullSearchCacheInvalidation : ISearchCacheInvalidationService
    {
        public void InvalidateAll() { }
    }
}
