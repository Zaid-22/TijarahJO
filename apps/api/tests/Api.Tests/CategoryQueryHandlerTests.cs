using Models;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.Application.Services;
using TijarahJoDB.BLL;

namespace TijarahJoDBAPI.Tests;

public sealed class CategoryQueryHandlerTests
{
    [Fact]
    public async Task GetByIdAsync_ReturnsBadRequest_WhenIdInvalid()
    {
        var service = new FakeCategoryService();
        var handler = new CategoryQueryHandler(service);

        CategoryByIdQueryResult result = await handler.GetByIdAsync(0);

        Assert.False(result.Success);
        Assert.Equal(400, result.StatusCode);
        Assert.Equal("Not accepted ID 0", result.Message);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNotFound_WhenCategoryMissing()
    {
        var service = new FakeCategoryService
        {
            NextFindResult = null
        };
        var handler = new CategoryQueryHandler(service);

        CategoryByIdQueryResult result = await handler.GetByIdAsync(42);

        Assert.False(result.Success);
        Assert.Equal(404, result.StatusCode);
        Assert.Equal("Category with ID 42 not found.", result.Message);
    }

    [Fact]
    public async Task GetAllAsync_FiltersDeletedAndBlankNames()
    {
        DateTime now = DateTime.UtcNow;
        var service = new FakeCategoryService
        {
            Categories = new List<CategoryModel>
            {
                CreateCategory(1, "Electronics", now, isDeleted: false),
                CreateCategory(2, "", now, isDeleted: false),
                CreateCategory(3, "Cars", now, isDeleted: true)
            }
        };
        var handler = new CategoryQueryHandler(service);

        CategoryListQueryResult result = await handler.GetAllAsync();

        Assert.True(result.Success);
        Assert.Equal(200, result.StatusCode);
        Assert.Single(result.Categories);
        Assert.Equal("Electronics", result.Categories[0].CategoryName);
    }

    [Fact]
    public async Task ExistsAsync_ReturnsBadRequest_WhenIdInvalid()
    {
        var service = new FakeCategoryService();
        var handler = new CategoryQueryHandler(service);

        CategoryExistsQueryResult result = await handler.ExistsAsync(0);

        Assert.False(result.Success);
        Assert.Equal(400, result.StatusCode);
        Assert.Equal("Not accepted ID 0", result.Message);
    }

    private static CategoryModel CreateCategory(int id, string name, DateTime createdAt, bool isDeleted)
    {
        return new CategoryModel(
            categoryid: id,
            categoryname: name,
            createdat: createdAt,
            isdeleted: isDeleted,
            namear: null,
            icon: null,
            color: null,
            image: null
        );
    }

    private sealed class FakeCategoryService : ICategoryService
    {
        public IReadOnlyList<CategoryModel> Categories { get; set; } = Array.Empty<CategoryModel>();
        public Category? NextFindResult { get; set; } = new Category(CreateCategory(1, "Default", DateTime.UtcNow, isDeleted: false), Category.ModeType.Update);
        public bool NextExists { get; set; } = true;

        public Task<IReadOnlyList<CategoryModel>> GetAllCategoriesAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
            => Task.FromResult(Categories);

        public Task<Category?> FindAsync(int? categoryId, CancellationToken cancellationToken = default)
            => Task.FromResult(NextFindResult);

        public Category Create(CategoryModel model) => new(model);

        public Task<bool> SaveAsync(Category category, CancellationToken cancellationToken = default)
            => Task.FromResult(true);

        public Task<bool> DeleteCategoryAsync(int? categoryId, CancellationToken cancellationToken = default)
            => Task.FromResult(true);

        public Task<bool> DoesCategoryExistAsync(int? categoryId, CancellationToken cancellationToken = default)
            => Task.FromResult(NextExists);
    }
}
