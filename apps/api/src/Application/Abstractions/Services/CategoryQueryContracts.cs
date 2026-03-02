using Models;

namespace TijarahJoDB.Application.Abstractions.Services;

public sealed class CategoryListQueryResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string? Message { get; init; }
    public IReadOnlyList<CategoryModel> Categories { get; init; } = Array.Empty<CategoryModel>();
}

public sealed class CategoryByIdQueryResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string? Message { get; init; }
    public CategoryModel? Category { get; init; }
}

public sealed class CategoryExistsQueryResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string? Message { get; init; }
    public bool Exists { get; init; }
}

public interface ICategoryQueryHandler
{
    Task<CategoryListQueryResult> GetAllAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default);

    Task<CategoryByIdQueryResult> GetByIdAsync(int categoryId, CancellationToken cancellationToken = default);

    Task<CategoryExistsQueryResult> ExistsAsync(int categoryId, CancellationToken cancellationToken = default);
}
