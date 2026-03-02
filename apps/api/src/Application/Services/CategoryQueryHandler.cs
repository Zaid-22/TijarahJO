using Models;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.BLL;

namespace TijarahJoDB.Application.Services;

public sealed class CategoryQueryHandler : ICategoryQueryHandler
{
    private readonly ICategoryService _categories;

    public CategoryQueryHandler(ICategoryService categories)
    {
        _categories = categories;
    }

    public async Task<CategoryListQueryResult> GetAllAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
    {
        IReadOnlyList<CategoryModel> categories = await _categories.GetAllCategoriesAsync(pageNumber, pageSize, cancellationToken);
        List<CategoryModel> visible = categories
            .Where(category => !category.IsDeleted && !string.IsNullOrWhiteSpace(category.CategoryName))
            .Select(CloneCategoryModel)
            .ToList();

        return new CategoryListQueryResult
        {
            Success = true,
            StatusCode = 200,
            Categories = visible
        };
    }

    public async Task<CategoryByIdQueryResult> GetByIdAsync(int categoryId, CancellationToken cancellationToken = default)
    {
        if (categoryId < 1)
        {
            return new CategoryByIdQueryResult
            {
                Success = false,
                StatusCode = 400,
                Message = $"Not accepted ID {categoryId}"
            };
        }

        Category? category = await _categories.FindAsync(categoryId, cancellationToken);
        if (category == null)
        {
            return new CategoryByIdQueryResult
            {
                Success = false,
                StatusCode = 404,
                Message = $"Category with ID {categoryId} not found."
            };
        }

        return new CategoryByIdQueryResult
        {
            Success = true,
            StatusCode = 200,
            Category = CloneCategoryModel(category.CategoryModel)
        };
    }

    public async Task<CategoryExistsQueryResult> ExistsAsync(int categoryId, CancellationToken cancellationToken = default)
    {
        if (categoryId < 1)
        {
            return new CategoryExistsQueryResult
            {
                Success = false,
                StatusCode = 400,
                Message = $"Not accepted ID {categoryId}"
            };
        }

        bool exists = await _categories.DoesCategoryExistAsync(categoryId, cancellationToken);
        return new CategoryExistsQueryResult
        {
            Success = true,
            StatusCode = 200,
            Exists = exists
        };
    }

    private static CategoryModel CloneCategoryModel(CategoryModel source)
    {
        return new CategoryModel(
            source.CategoryID,
            source.CategoryName,
            source.CreatedAt,
            source.IsDeleted,
            source.NameAr,
            source.Icon,
            source.Color,
            source.Image
        );
    }
}
