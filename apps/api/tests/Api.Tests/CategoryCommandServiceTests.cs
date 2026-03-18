using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Services;
using TijarahJo.Application.Common;

namespace TijarahJo.Api.Tests;

/// <summary>
/// Unit tests for <see cref="CategoryCommandService"/>.
/// Uses in-process fakes — no database required.
/// </summary>
public sealed class CategoryCommandServiceTests
{
    // -------------------------------------------------------------------------
    // CreateAsync
    // -------------------------------------------------------------------------

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task CreateAsync_ReturnsInvalidRequest_WhenNameMissing(string? name)
    {
        var svc = BuildService();
        var result = await svc.CreateAsync(new CreateCategoryCommand { CategoryName = name });

        Assert.False(result.Success);
        Assert.Equal(CategoryCommandFailureReason.InvalidRequest, result.FailureReason);
    }

    [Fact]
    public async Task CreateAsync_ReturnsPersistenceFailed_WhenSaveFails()
    {
        var svc = BuildService(saveFails: true);
        var result = await svc.CreateAsync(new CreateCategoryCommand { CategoryName = "TestCat" });

        Assert.False(result.Success);
        Assert.Equal(CategoryCommandFailureReason.PersistenceFailed, result.FailureReason);
    }

    [Fact]
    public async Task CreateAsync_ReturnsSuccess_WithValidData()
    {
        var svc = BuildService();
        var result = await svc.CreateAsync(new CreateCategoryCommand
        {
            CategoryName = "Electronics",
            NameAr = "إلكترونيات",
            Icon = "📱",
            Color = "#3B82F6",
            Image = "https://example.com/electronics.png"
        });

        Assert.True(result.Success);
        Assert.NotNull(result.Category);
        Assert.Equal("Electronics", result.Category!.CategoryName);
    }

    // -------------------------------------------------------------------------
    // UpdateAsync
    // -------------------------------------------------------------------------

    [Fact]
    public async Task UpdateAsync_ReturnsInvalidRequest_WhenIdInvalid()
    {
        var svc = BuildService();
        var result = await svc.UpdateAsync(new UpdateCategoryCommand
        {
            CategoryId = 0,
            CategoryName = "Updated"
        });

        Assert.False(result.Success);
        Assert.Equal(CategoryCommandFailureReason.InvalidRequest, result.FailureReason);
    }

    [Fact]
    public async Task UpdateAsync_ReturnsInvalidRequest_WhenNameEmpty()
    {
        var svc = BuildService();
        var result = await svc.UpdateAsync(new UpdateCategoryCommand
        {
            CategoryId = 1,
            CategoryName = ""
        });

        Assert.False(result.Success);
        Assert.Equal(CategoryCommandFailureReason.InvalidRequest, result.FailureReason);
    }

    [Fact]
    public async Task UpdateAsync_ReturnsNotFound_WhenCategoryMissing()
    {
        var svc = BuildService(findReturnsNull: true);
        var result = await svc.UpdateAsync(new UpdateCategoryCommand
        {
            CategoryId = 999,
            CategoryName = "Nope"
        });

        Assert.False(result.Success);
        Assert.Equal(CategoryCommandFailureReason.NotFound, result.FailureReason);
    }

    [Fact]
    public async Task UpdateAsync_ReturnsSuccess_WhenValid()
    {
        var svc = BuildService();
        var result = await svc.UpdateAsync(new UpdateCategoryCommand
        {
            CategoryId = 1,
            CategoryName = "Updated Name",
            NameAr = "اسم محدث"
        });

        Assert.True(result.Success);
        Assert.NotNull(result.Category);
        Assert.Equal("Updated Name", result.Category!.CategoryName);
    }

    // -------------------------------------------------------------------------
    // DeleteAsync
    // -------------------------------------------------------------------------

    [Fact]
    public async Task DeleteAsync_ReturnsInvalidRequest_WhenIdInvalid()
    {
        var svc = BuildService();
        var result = await svc.DeleteAsync(0);

        Assert.False(result.Success);
        Assert.Equal(CategoryCommandFailureReason.InvalidRequest, result.FailureReason);
    }

    [Fact]
    public async Task DeleteAsync_ReturnsNotFound_WhenCategoryMissing()
    {
        var svc = BuildService(findReturnsNull: true);
        var result = await svc.DeleteAsync(999);

        Assert.False(result.Success);
        Assert.Equal(CategoryCommandFailureReason.NotFound, result.FailureReason);
    }

    [Fact]
    public async Task DeleteAsync_ReturnsSuccess_WhenValid()
    {
        var svc = BuildService();
        var result = await svc.DeleteAsync(1);

        Assert.True(result.Success);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private static CategoryCommandService BuildService(
        bool findReturnsNull = false,
        bool saveFails = false)
    {
        return new CategoryCommandService(new FakeCategoryService(findReturnsNull, saveFails));
    }

    // -------------------------------------------------------------------------
    // Fakes
    // -------------------------------------------------------------------------

    private sealed class FakeCategoryService : ICategoryService
    {
        private readonly bool _findReturnsNull;
        private readonly bool _saveFails;

        public FakeCategoryService(bool findReturnsNull, bool saveFails)
        {
            _findReturnsNull = findReturnsNull;
            _saveFails = saveFails;
        }

        public Task<IReadOnlyList<CategoryModel>> GetAllCategoriesAsync(int page = 1, int size = 50, CancellationToken ct = default)
            => Task.FromResult<IReadOnlyList<CategoryModel>>(Array.Empty<CategoryModel>());

        public Task<Category?> FindAsync(int? categoryId, CancellationToken ct = default)
        {
            if (_findReturnsNull) return Task.FromResult<Category?>(null);

            var model = new CategoryModel(categoryId ?? 1, "Existing", DateTime.UtcNow, false, null, null, null, null);
            return Task.FromResult<Category?>(new Category(model, Category.ModeType.Update));
        }

        public Category Create(CategoryModel model) => new(model);

        public Task<bool> SaveAsync(Category category, CancellationToken ct = default)
            => Task.FromResult(!_saveFails);

        public Task<bool> DeleteCategoryAsync(int? categoryId, CancellationToken ct = default)
            => Task.FromResult(true);

        public Task<bool> DoesCategoryExistAsync(int? categoryId, CancellationToken ct = default)
            => Task.FromResult(!_findReturnsNull);
    }
}
