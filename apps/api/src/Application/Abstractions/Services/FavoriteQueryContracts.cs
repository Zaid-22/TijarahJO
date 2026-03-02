namespace TijarahJoDB.Application.Abstractions.Services;

public sealed class FavoriteListQueryResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string? Message { get; init; }
    public IReadOnlyList<string> FavoritePostIds { get; init; } = Array.Empty<string>();
}

public sealed class FavoriteOperationQueryResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string? Message { get; init; }
}

public interface IFavoriteQueryHandler
{
    Task<FavoriteListQueryResult> GetFavoritesAsync(int userId, CancellationToken cancellationToken = default);

    Task<FavoriteOperationQueryResult> AddAsync(int userId, string? postId, CancellationToken cancellationToken = default);

    Task<FavoriteOperationQueryResult> RemoveAsync(int userId, string? postId, CancellationToken cancellationToken = default);
}
