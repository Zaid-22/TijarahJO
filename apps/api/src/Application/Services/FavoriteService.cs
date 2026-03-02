using Models;
using TijarahJoDB.Application.Abstractions.DataAccess;
using TijarahJoDB.Application.Abstractions.Services;

namespace TijarahJoDB.Application.Services;

public sealed class FavoriteService : IFavoriteService
{
    private readonly IFavoriteDataAccess _favorites;

    public FavoriteService(IFavoriteDataAccess favorites)
    {
        _favorites = favorites;
    }

    public Task<IReadOnlyList<FavoriteModel>> GetFavoritesByUserIdAsync(int userId, CancellationToken cancellationToken = default)
        => _favorites.GetFavoritesByUserIdAsync(userId, cancellationToken);

    public Task<bool> AddFavoriteAsync(int userId, int postId, CancellationToken cancellationToken = default)
        => _favorites.AddFavoriteAsync(userId, postId, cancellationToken);

    public Task<bool> RemoveFavoriteAsync(int userId, int postId, CancellationToken cancellationToken = default)
        => _favorites.RemoveFavoriteAsync(userId, postId, cancellationToken);

    public Task<bool> IsFavoriteAsync(int userId, int postId, CancellationToken cancellationToken = default)
        => _favorites.IsFavoriteAsync(userId, postId, cancellationToken);
}
