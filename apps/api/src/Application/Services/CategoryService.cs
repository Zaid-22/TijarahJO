using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application;
using TijarahJo.Application.Common;

namespace TijarahJo.Application.Services;

public sealed class CategoryService(ICategoryDataAccess categories) : ICategoryService
{
    private readonly ICategoryDataAccess _categories = categories;

    public Task<IReadOnlyList<CategoryModel>> GetAllCategoriesAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
        => _categories.GetAllCategoriesAsync(pageNumber, pageSize, cancellationToken);

    public async Task<Category?> FindAsync(int? categoryId, CancellationToken cancellationToken = default)
    {
        CategoryModel categoryModel = await _categories.GetCategoryByIDAsync(categoryId, cancellationToken);
        return categoryModel == null
            ? null
            : new Category(categoryModel, Category.ModeType.Update);
    }

    public Category Create(CategoryModel model) => new(model);

    public async Task<bool> SaveAsync(Category category, CancellationToken cancellationToken = default)
    {
        if (category.Mode == Category.ModeType.AddNew)
        {
            int categoryId = await _categories.AddCategoryAsync(category.CategoryModel, cancellationToken);
            if (categoryId <= 0)
            {
                return false;
            }

            category.CategoryID = categoryId;
            category.Mode = Category.ModeType.Update;
            return true;
        }

        return await _categories.UpdateCategoryAsync(category.CategoryModel, cancellationToken);
    }

    public Task<bool> DeleteCategoryAsync(int? categoryId, CancellationToken cancellationToken = default)
        => _categories.DeleteCategoryAsync(categoryId, cancellationToken);

    public Task<bool> DoesCategoryExistAsync(int? categoryId, CancellationToken cancellationToken = default)
        => _categories.DoesCategoryExistAsync(categoryId, cancellationToken);
}
