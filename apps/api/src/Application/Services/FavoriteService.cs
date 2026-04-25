using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Application.Services;

public sealed class FavoriteService(IFavoriteDataAccess favorites) : IFavoriteService
{
    public Task<IReadOnlyList<FavoriteModel>> GetFavoritesByUserIdAsync(int userId, CancellationToken cancellationToken = default)
        => favorites.GetFavoritesByUserIdAsync(userId, cancellationToken);

    public Task<bool> AddFavoriteAsync(int userId, int postId, CancellationToken cancellationToken = default)
        => favorites.AddFavoriteAsync(userId, postId, cancellationToken);

    public Task<bool> RemoveFavoriteAsync(int userId, int postId, CancellationToken cancellationToken = default)
        => favorites.RemoveFavoriteAsync(userId, postId, cancellationToken);

    public Task<bool> IsFavoriteAsync(int userId, int postId, CancellationToken cancellationToken = default)
        => favorites.IsFavoriteAsync(userId, postId, cancellationToken);
}
