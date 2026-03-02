using TijarahJo.Domain.Models;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.Application.Services;

namespace TijarahJoDBAPI.Tests;

public sealed class FavoriteQueryHandlerTests
{
    [Fact]
    public async Task GetFavoritesAsync_ReturnsUnauthorized_WhenUserIdIsInvalid()
    {
        var favorites = new FakeFavoriteService();
        var commands = new FakeFavoriteCommandService();
        var handler = new FavoriteQueryHandler(favorites, commands);

        FavoriteListQueryResult result = await handler.GetFavoritesAsync(0);

        Assert.False(result.Success);
        Assert.Equal(401, result.StatusCode);
        Assert.Equal(0, favorites.GetFavoritesCalls);
    }

    [Fact]
    public async Task AddAsync_ReturnsBadRequest_WhenPostIdIsInvalid()
    {
        var favorites = new FakeFavoriteService();
        var commands = new FakeFavoriteCommandService();
        var handler = new FavoriteQueryHandler(favorites, commands);

        FavoriteOperationQueryResult result = await handler.AddAsync(10, "abc");

        Assert.False(result.Success);
        Assert.Equal(400, result.StatusCode);
        Assert.Equal(0, commands.AddCalls);
    }

    [Fact]
    public async Task AddAsync_MapsPostNotFound_ToNotFound()
    {
        var favorites = new FakeFavoriteService();
        var commands = new FakeFavoriteCommandService
        {
            NextAddResult = new FavoriteMutationResult
            {
                Success = false,
                FailureReason = FavoriteMutationFailureReason.PostNotFound,
                Message = "Post with ID 5 not found."
            }
        };
        var handler = new FavoriteQueryHandler(favorites, commands);

        FavoriteOperationQueryResult result = await handler.AddAsync(12, "5");

        Assert.False(result.Success);
        Assert.Equal(404, result.StatusCode);
        Assert.Equal("Post with ID 5 not found.", result.Message);
    }

    [Fact]
    public async Task RemoveAsync_ReturnsSuccess_WhenMutationSucceeds()
    {
        var favorites = new FakeFavoriteService();
        var commands = new FakeFavoriteCommandService
        {
            NextRemoveResult = new FavoriteMutationResult
            {
                Success = true
            }
        };
        var handler = new FavoriteQueryHandler(favorites, commands);

        FavoriteOperationQueryResult result = await handler.RemoveAsync(7, "9");

        Assert.True(result.Success);
        Assert.Equal(200, result.StatusCode);
    }

    private sealed class FakeFavoriteService : IFavoriteService
    {
        public int GetFavoritesCalls { get; private set; }

        public Task<IReadOnlyList<FavoriteModel>> GetFavoritesByUserIdAsync(int userId, CancellationToken cancellationToken = default)
        {
            GetFavoritesCalls++;
            return Task.FromResult<IReadOnlyList<FavoriteModel>>(Array.Empty<FavoriteModel>());
        }

        public Task<bool> AddFavoriteAsync(int userId, int postId, CancellationToken cancellationToken = default)
            => Task.FromResult(true);

        public Task<bool> RemoveFavoriteAsync(int userId, int postId, CancellationToken cancellationToken = default)
            => Task.FromResult(true);

        public Task<bool> IsFavoriteAsync(int userId, int postId, CancellationToken cancellationToken = default)
            => Task.FromResult(false);
    }

    private sealed class FakeFavoriteCommandService : IFavoriteCommandService
    {
        public FavoriteMutationResult NextAddResult { get; set; } = new() { Success = true };
        public FavoriteMutationResult NextRemoveResult { get; set; } = new() { Success = true };
        public int AddCalls { get; private set; }

        public Task<FavoriteMutationResult> AddAsync(int userId, int postId, CancellationToken cancellationToken = default)
        {
            AddCalls++;
            return Task.FromResult(NextAddResult);
        }

        public Task<FavoriteMutationResult> RemoveAsync(int userId, int postId, CancellationToken cancellationToken = default)
            => Task.FromResult(NextRemoveResult);
    }
}
