using TijarahJo.Domain.Models;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.BLL;

namespace TijarahJoDB.Application.Services;

public sealed class CategoryCommandService : ICategoryCommandService
{
    private static readonly DateTime SqlDateTimeMinUtc = new(1753, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private readonly ICategoryService _categories;

    public CategoryCommandService(ICategoryService categories)
    {
        _categories = categories;
    }

    public async Task<CategoryCommandResult> CreateAsync(CreateCategoryCommand command, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(command.CategoryName))
        {
            return Failure(CategoryCommandFailureReason.InvalidRequest, "Invalid category data.");
        }

        Category category = _categories.Create(new CategoryModel(
            null,
            command.CategoryName.Trim(),
            NormalizeSqlDateTime(DateTime.UtcNow),
            false,
            NormalizeOptionalText(command.NameAr),
            NormalizeOptionalText(command.Icon),
            NormalizeOptionalText(command.Color),
            NormalizeOptionalText(command.Image)
        ));

        bool saved = await _categories.SaveAsync(category, cancellationToken);
        if (!saved)
        {
            return Failure(CategoryCommandFailureReason.PersistenceFailed, "Error adding category.");
        }

        return new CategoryCommandResult
        {
            Success = true,
            Category = category
        };
    }

    public async Task<CategoryCommandResult> UpdateAsync(UpdateCategoryCommand command, CancellationToken cancellationToken = default)
    {
        if (command.CategoryId < 1 || string.IsNullOrWhiteSpace(command.CategoryName))
        {
            return Failure(CategoryCommandFailureReason.InvalidRequest, "Invalid category data.");
        }

        Category? category = await _categories.FindAsync(command.CategoryId, cancellationToken);
        if (category == null)
        {
            return Failure(CategoryCommandFailureReason.NotFound, $"Category with ID {command.CategoryId} not found.");
        }

        category.CategoryName = command.CategoryName.Trim();
        if (command.NameAr != null)
        {
            category.NameAr = NormalizeOptionalText(command.NameAr);
        }

        if (command.Icon != null)
        {
            category.Icon = NormalizeOptionalText(command.Icon);
        }

        if (command.Color != null)
        {
            category.Color = NormalizeOptionalText(command.Color);
        }

        if (command.Image != null)
        {
            category.Image = NormalizeOptionalText(command.Image);
        }

        category.CreatedAt = NormalizeSqlDateTime(category.CreatedAt, DateTime.UtcNow);

        bool saved = await _categories.SaveAsync(category, cancellationToken);
        if (!saved)
        {
            return Failure(CategoryCommandFailureReason.PersistenceFailed, "Error updating category.");
        }

        return new CategoryCommandResult
        {
            Success = true,
            Category = category
        };
    }

    public async Task<CategoryCommandResult> DeleteAsync(int categoryId, CancellationToken cancellationToken = default)
    {
        if (categoryId < 1)
        {
            return Failure(CategoryCommandFailureReason.InvalidRequest, "Invalid category ID.");
        }

        if (await _categories.FindAsync(categoryId, cancellationToken) == null)
        {
            return Failure(CategoryCommandFailureReason.NotFound, $"Category with ID {categoryId} not found.");
        }

        bool deleted = await _categories.DeleteCategoryAsync(categoryId, cancellationToken);
        if (!deleted)
        {
            return Failure(CategoryCommandFailureReason.PersistenceFailed, "Failed to delete category.");
        }

        return new CategoryCommandResult
        {
            Success = true
        };
    }

    private static DateTime NormalizeSqlDateTime(DateTime value, DateTime? fallback = null)
    {
        if (value == default || value < SqlDateTimeMinUtc)
        {
            return fallback ?? DateTime.UtcNow;
        }

        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
    }

    private static string? NormalizeOptionalText(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static CategoryCommandResult Failure(CategoryCommandFailureReason reason, string message)
    {
        return new CategoryCommandResult
        {
            Success = false,
            FailureReason = reason,
            Message = message
        };
    }
}
