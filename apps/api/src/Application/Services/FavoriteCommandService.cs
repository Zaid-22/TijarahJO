using System.Threading;
using System.Threading.Tasks;
using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Application.Services;

public sealed class FavoriteCommandService : IFavoriteCommandService
{
    private readonly IFavoriteService _favorites;
    private readonly IPostReadService _postReads;

    public FavoriteCommandService(IFavoriteService favorites, IPostReadService postReads)
    {
        _favorites = favorites;
        _postReads = postReads;
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

        PostReadResult postResult = await _postReads.GetByIdAsync(postId, cancellationToken);
        if (!postResult.Success || postResult.Post == null)
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
