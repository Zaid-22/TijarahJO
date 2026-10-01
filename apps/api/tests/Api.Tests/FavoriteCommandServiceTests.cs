using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Services;
using TijarahJo.Application.Common;

namespace TijarahJo.Api.Tests;

/// <summary>
/// Unit tests for <see cref="FavoriteCommandService"/>.
/// Uses in-process fakes — no database required.
/// </summary>
public sealed class FavoriteCommandServiceTests
{
    // -------------------------------------------------------------------------
    // AddAsync
    // -------------------------------------------------------------------------

    [Theory]
    [InlineData(0, 1)]
    [InlineData(-1, 1)]
    [InlineData(1, 0)]
    [InlineData(1, -1)]
    public async Task AddAsync_ReturnsInvalidRequest_WhenIdsAreInvalid(int userId, int postId)
    {
        var svc = BuildService();
        var result = await svc.AddAsync(userId, postId);

        Assert.False(result.Success);
        Assert.Equal(FavoriteMutationFailureReason.InvalidRequest, result.FailureReason);
    }

    [Fact]
    public async Task AddAsync_ReturnsPostNotFound_WhenPostDoesNotExist()
    {
        var svc = BuildService(postExists: false);
        var result = await svc.AddAsync(1, 999);

        Assert.False(result.Success);
        Assert.Equal(FavoriteMutationFailureReason.PostNotFound, result.FailureReason);
    }

    [Fact]
    public async Task AddAsync_ReturnsPostNotFound_WhenPostIsBlocked()
    {
        var svc = BuildService(postStatus: PostStatusPolicy.Blocked);
        var result = await svc.AddAsync(1, 1);

        Assert.False(result.Success);
        Assert.Equal(FavoriteMutationFailureReason.PostNotFound, result.FailureReason);
    }

    [Fact]
    public async Task AddAsync_ReturnsPersistenceFailed_WhenSaveFails()
    {
        var svc = BuildService(addFails: true);
        var result = await svc.AddAsync(1, 1);

        Assert.False(result.Success);
        Assert.Equal(FavoriteMutationFailureReason.PersistenceFailed, result.FailureReason);
    }

    [Fact]
    public async Task AddAsync_ReturnsSuccess_WhenValid()
    {
        var svc = BuildService();
        var result = await svc.AddAsync(1, 1);

        Assert.True(result.Success);
    }

    // -------------------------------------------------------------------------
    // RemoveAsync
    // -------------------------------------------------------------------------

    [Theory]
    [InlineData(0, 1)]
    [InlineData(1, 0)]
    public async Task RemoveAsync_ReturnsInvalidRequest_WhenIdsAreInvalid(int userId, int postId)
    {
        var svc = BuildService();
        var result = await svc.RemoveAsync(userId, postId);

        Assert.False(result.Success);
        Assert.Equal(FavoriteMutationFailureReason.InvalidRequest, result.FailureReason);
    }

    [Fact]
    public async Task RemoveAsync_ReturnsNotFound_WhenFavoriteDoesNotExist()
    {
        var svc = BuildService(removeFails: true);
        var result = await svc.RemoveAsync(1, 1);

        Assert.False(result.Success);
        Assert.Equal(FavoriteMutationFailureReason.NotFound, result.FailureReason);
    }

    [Fact]
    public async Task RemoveAsync_ReturnsSuccess_WhenValid()
    {
        var svc = BuildService();
        var result = await svc.RemoveAsync(1, 1);

        Assert.True(result.Success);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private static FavoriteCommandService BuildService(
        bool postExists = true,
        bool addFails = false,
        bool removeFails = false,
        int postStatus = PostStatusPolicy.Active)
    {
        return new FavoriteCommandService(
            new FakeFavoriteService(addFails, removeFails),
            new FakePostReadService(postExists, postStatus)
        );
    }

    // -------------------------------------------------------------------------
    // Fakes
    // -------------------------------------------------------------------------

    private sealed class FakeFavoriteService : IFavoriteService
    {
        private readonly bool _addFails;
        private readonly bool _removeFails;

        public FakeFavoriteService(bool addFails, bool removeFails)
        {
            _addFails = addFails;
            _removeFails = removeFails;
        }

        public Task<IReadOnlyList<FavoriteModel>> GetFavoritesByUserIdAsync(int userId, CancellationToken ct = default)
            => Task.FromResult<IReadOnlyList<FavoriteModel>>(Array.Empty<FavoriteModel>());

        public Task<bool> AddFavoriteAsync(int userId, int postId, CancellationToken ct = default)
            => Task.FromResult(!_addFails);

        public Task<bool> RemoveFavoriteAsync(int userId, int postId, CancellationToken ct = default)
            => Task.FromResult(!_removeFails);

        public Task<bool> IsFavoriteAsync(int userId, int postId, CancellationToken ct = default)
            => Task.FromResult(false);
    }

    private sealed class FakePostReadService : IPostReadService
    {
        private readonly bool _exists;
        private readonly int _status;

        public FakePostReadService(bool exists, int status)
        {
            _exists = exists;
            _status = status;
        }

        public Task<PostReadResult> GetByIdAsync(int postId, CancellationToken ct = default)
        {
            if (!_exists || !PostStatusPolicy.IsPubliclyVisible(_status, isDeleted: false))
            {
                return Task.FromResult(new PostReadResult
                {
                    Success = false,
                    FailureReason = PostReadFailureReason.NotFound
                });
            }

            var post = new Post(
                new PostModel(postId, 1, 1, "Post", "Description", 1m, _status, DateTime.UtcNow, false, 0, null, null),
                Post.ModeType.Update);
            return Task.FromResult(new PostReadResult { Success = true, Post = post });
        }

        public Task<PostExistsResult> ExistsAsync(int postId, CancellationToken ct = default) => throw new NotSupportedException();
        public Task<PostReadCollectionResult> GetByUserIdAsync(int userId, int page = 1, int size = 50, CancellationToken ct = default) => throw new NotSupportedException();
        public Task<PostReadCollectionResult> GetByCategoryIdAsync(int categoryId, int page = 1, int size = 50, CancellationToken ct = default) => throw new NotSupportedException();
        public Task<PostViewIncrementResult> IncrementViewsAsync(int postId, CancellationToken ct = default) => throw new NotSupportedException();
    }
}
