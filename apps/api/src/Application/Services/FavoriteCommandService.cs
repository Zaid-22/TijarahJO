using System.Threading;
using System.Threading.Tasks;
using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Application.Services;

public sealed class FavoriteCommandService : IFavoriteCommandService
{
    private readonly IFavoriteService _favorites;
    private readonly IPostService _posts;

    public FavoriteCommandService(IFavoriteService favorites, IPostService posts)
    {
        _favorites = favorites;
        _posts = posts;
    }

    public async Task<FavoriteMutationResult> AddAsync(
        int userId,
        int postId,
        CancellationToken cancellationToken = default
    )
    {
        if (userId < 1 || postId < 1)
        {
            return Failure(FavoriteMutationFailureReason.InvalidRequest, "Invalid user or post id.");
        }

        if (!await _posts.DoesPostExistAsync(postId, cancellationToken))
        {
            return Failure(FavoriteMutationFailureReason.PostNotFound, $"Post with ID {postId} not found.");
        }

        bool saved = await _favorites.AddFavoriteAsync(userId, postId, cancellationToken);
        if (!saved)
        {
            return Failure(FavoriteMutationFailureReason.PersistenceFailed, "Failed to add favorite.");
        }

        return new FavoriteMutationResult
        {
            Success = true
        };
    }

    public async Task<FavoriteMutationResult> RemoveAsync(
        int userId,
        int postId,
        CancellationToken cancellationToken = default
    )
    {
        if (userId < 1 || postId < 1)
        {
            return Failure(FavoriteMutationFailureReason.InvalidRequest, "Invalid user or post id.");
        }

        bool removed = await _favorites.RemoveFavoriteAsync(userId, postId, cancellationToken);
        if (!removed)
        {
            return Failure(FavoriteMutationFailureReason.NotFound, "Favorite was not found.");
        }

        return new FavoriteMutationResult
        {
            Success = true
        };
    }

    private static FavoriteMutationResult Failure(FavoriteMutationFailureReason reason, string message)
    {
        return new FavoriteMutationResult
        {
            Success = false,
            FailureReason = reason,
            Message = message
        };
    }
}
