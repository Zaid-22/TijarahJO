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
        bool removeFails = false)
    {
        return new FavoriteCommandService(
            new FakeFavoriteService(addFails, removeFails),
            new FakePostService(postExists)
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

    private sealed class FakePostService : IPostService
    {
        private readonly bool _exists;
        public FakePostService(bool exists) => _exists = exists;

        public Task<bool> DoesPostExistAsync(int? postId, CancellationToken ct = default)
            => Task.FromResult(_exists);

        // Not used by FavoriteCommandService
        public Task<Post?> FindAsync(int? postId, CancellationToken ct = default) => throw new NotImplementedException();
        public Post Create(PostModel model) => throw new NotImplementedException();
        public Task<bool> SaveAsync(Post post, CancellationToken ct = default) => throw new NotImplementedException();
        public Task<bool> DeletePostAsync(int? postId, int actorUserId, CancellationToken ct = default) => throw new NotImplementedException();
        public Task<bool> IncrementViewsAsync(int? postId, CancellationToken ct = default) => throw new NotImplementedException();
        public Task<IReadOnlyList<PostModel>> GetPostsByUserIdAsync(int userId, int page = 1, int size = 50, CancellationToken ct = default) => throw new NotImplementedException();
        public Task<IReadOnlyList<PostModel>> GetPostsByCategoryIdAsync(int catId, int page = 1, int size = 50, CancellationToken ct = default) => throw new NotImplementedException();
    }
}
