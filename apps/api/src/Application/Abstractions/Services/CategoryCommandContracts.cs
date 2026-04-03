using TijarahJo.Application;
using TijarahJo.Application.Common;

namespace TijarahJo.Application.Abstractions.Services;

public enum CategoryCommandFailureReason
{
    InvalidRequest,
    NotFound,
    PersistenceFailed
}

public sealed class CategoryCommandResult
{
    public bool Success { get; init; }
    public Category? Category { get; init; }
    public CategoryCommandFailureReason? FailureReason { get; init; }
    public string? Message { get; init; }
}

public sealed class CreateCategoryCommand
{
    public string? CategoryName { get; init; }
    public string? NameAr { get; init; }
    public string? Image { get; init; }
}

public sealed class UpdateCategoryCommand
{
    public int CategoryId { get; init; }
    public string? CategoryName { get; init; }
    public string? NameAr { get; init; }
    public string? Image { get; init; }
}

public interface ICategoryCommandService
{
    Task<CategoryCommandResult> CreateAsync(CreateCategoryCommand command, CancellationToken cancellationToken = default);

    Task<CategoryCommandResult> UpdateAsync(UpdateCategoryCommand command, CancellationToken cancellationToken = default);

    Task<CategoryCommandResult> DeleteAsync(int categoryId, CancellationToken cancellationToken = default);
}
