using System.Globalization;
using TijarahJoDB.Application.Abstractions.Services;

namespace TijarahJoDB.Application.Services;

public sealed class FavoriteQueryHandler : IFavoriteQueryHandler
{
    private readonly IFavoriteService _favorites;
    private readonly IFavoriteCommandService _favoriteCommands;

    public FavoriteQueryHandler(IFavoriteService favorites, IFavoriteCommandService favoriteCommands)
    {
        _favorites = favorites;
        _favoriteCommands = favoriteCommands;
    }

    public async Task<FavoriteListQueryResult> GetFavoritesAsync(int userId, CancellationToken cancellationToken = default)
    {
        if (userId < 1)
        {
            return new FavoriteListQueryResult
            {
                Success = false,
                StatusCode = 401,
                Message = "Invalid authentication token."
            };
        }

        IReadOnlyList<Models.FavoriteModel> favorites = await _favorites.GetFavoritesByUserIdAsync(userId, cancellationToken);
        IReadOnlyList<string> favoritePostIds = favorites
            .Select(favorite => favorite.PostID.ToString(CultureInfo.InvariantCulture))
            .ToList();

        return new FavoriteListQueryResult
        {
            Success = true,
            StatusCode = 200,
            FavoritePostIds = favoritePostIds
        };
    }

    public async Task<FavoriteOperationQueryResult> AddAsync(int userId, string? postId, CancellationToken cancellationToken = default)
    {
        if (userId < 1)
        {
            return Unauthorized();
        }

        if (!TryParsePostId(postId, out int parsedPostId))
        {
            return InvalidPostId(postId);
        }

        FavoriteMutationResult result = await _favoriteCommands.AddAsync(userId, parsedPostId, cancellationToken);
        return MapMutationResult(result, "Favorite operation failed.");
    }

    public async Task<FavoriteOperationQueryResult> RemoveAsync(int userId, string? postId, CancellationToken cancellationToken = default)
    {
        if (userId < 1)
        {
            return Unauthorized();
        }

        if (!TryParsePostId(postId, out int parsedPostId))
        {
            return InvalidPostId(postId);
        }

        FavoriteMutationResult result = await _favoriteCommands.RemoveAsync(userId, parsedPostId, cancellationToken);
        return MapMutationResult(result, "Favorite operation failed.");
    }

    private static FavoriteOperationQueryResult Unauthorized()
        => new()
        {
            Success = false,
            StatusCode = 401,
            Message = "Invalid authentication token."
        };

    private static FavoriteOperationQueryResult InvalidPostId(string? postId)
        => new()
        {
            Success = false,
            StatusCode = 400,
            Message = $"Invalid post ID: {postId}"
        };

    private static bool TryParsePostId(string? postId, out int parsedPostId)
    {
        parsedPostId = 0;
        return !string.IsNullOrWhiteSpace(postId) &&
               int.TryParse(postId.Trim(), out parsedPostId) &&
               parsedPostId > 0;
    }

    private static FavoriteOperationQueryResult MapMutationResult(FavoriteMutationResult result, string fallbackMessage)
    {
        if (result.Success)
        {
            return new FavoriteOperationQueryResult
            {
                Success = true,
                StatusCode = 200
            };
        }

        int statusCode = result.FailureReason switch
        {
            FavoriteMutationFailureReason.InvalidRequest => 400,
            FavoriteMutationFailureReason.PostNotFound => 404,
            FavoriteMutationFailureReason.NotFound => 404,
            _ => 500
        };

        return new FavoriteOperationQueryResult
        {
            Success = false,
            StatusCode = statusCode,
            Message = result.Message ?? fallbackMessage
        };
    }
}
