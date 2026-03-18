using TijarahJo.Domain.Models;

namespace TijarahJo.Application.Abstractions.Services;

public sealed class PostImageListQueryResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string? Message { get; init; }
    public IReadOnlyList<PostImageModel> PostImages { get; init; } = Array.Empty<PostImageModel>();
}

public sealed class PostImageByIdQueryResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string? Message { get; init; }
    public PostImageModel? PostImage { get; init; }
}

public sealed class PostImageExistsQueryResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string? Message { get; init; }
    public bool Exists { get; init; }
}

public interface IPostImageQueryHandler
{
    Task<PostImageListQueryResult> GetAllAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default);

    Task<PostImageListQueryResult> GetByPostIdAsync(int postId, CancellationToken cancellationToken = default);

    Task<PostImageByIdQueryResult> GetByIdAsync(int postImageId, CancellationToken cancellationToken = default);

    Task<PostImageExistsQueryResult> ExistsAsync(int postImageId, CancellationToken cancellationToken = default);
}
