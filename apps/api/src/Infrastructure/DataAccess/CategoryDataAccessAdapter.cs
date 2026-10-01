using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Common;
using TijarahJo.Domain.Entities;
using TijarahJo.Infrastructure.Persistence;

namespace TijarahJo.Infrastructure.DataAccess;


public sealed class CategoryDataAccessAdapter(TijarahJoDbContext dbContext) : ICategoryDataAccess
{

    public CategoryModel GetCategoryByID(int? categoryId)
    {
        if (!categoryId.HasValue || categoryId.Value < 1)
        {
            return null!;
        }

        CategoryEntity? entity = dbContext.Categories
            .AsNoTracking()
            .FirstOrDefault(item => item.CategoryID == categoryId.Value);
        return entity is null ? null! : ToModel(entity);
    }

    public async Task<CategoryModel> GetCategoryByIDAsync(int? categoryId, CancellationToken cancellationToken = default)
    {
        if (!categoryId.HasValue || categoryId.Value < 1)
        {
            return null!;
        }

        CategoryEntity? entity = await dbContext.Categories
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.CategoryID == categoryId.Value, cancellationToken);
        return entity is null ? null! : ToModel(entity);
    }

    public async Task<int> AddCategoryAsync(CategoryModel category, CancellationToken cancellationToken = default)
    {
        var entity = new CategoryEntity
        {
            CategoryName = category.CategoryName,
            NameAr = category.NameAr,
            Image = category.Image,
            CreatedAt = category.CreatedAt == default ? DateTime.UtcNow : category.CreatedAt,
            IsDeleted = category.IsDeleted
        };

        dbContext.Categories.Add(entity);
        dbContext.AuditActorUserId = null; // admin-only operation; actor set by command service if needed
        await dbContext.SaveChangesAsync(cancellationToken);
        return entity.CategoryID;
    }

    public async Task<bool> UpdateCategoryAsync(CategoryModel category, CancellationToken cancellationToken = default)
    {
        if (!category.CategoryID.HasValue || category.CategoryID.Value < 1)
        {
            return false;
        }

        CategoryEntity? entity = await dbContext.Categories
            .FirstOrDefaultAsync(item => item.CategoryID == category.CategoryID.Value, cancellationToken);
        if (entity is null)
        {
            return false;
        }

        entity.CategoryName = category.CategoryName;
        entity.NameAr = category.NameAr;
        entity.Image = category.Image;
        entity.CreatedAt = category.CreatedAt == default ? entity.CreatedAt : category.CreatedAt;
        entity.IsDeleted = category.IsDeleted;

        dbContext.AuditActorUserId = null;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteCategoryAsync(int? categoryId, CancellationToken cancellationToken = default)
    {
        if (!categoryId.HasValue || categoryId.Value < 1)
        {
            return false;
        }

        CategoryEntity? entity = await dbContext.Categories
            .FirstOrDefaultAsync(item => item.CategoryID == categoryId.Value, cancellationToken);
        if (entity is null)
        {
            return false;
        }

        if (entity.IsDeleted)
        {
            return false;
        }

        entity.IsDeleted = true;
        dbContext.AuditActorUserId = null;
        return await dbContext.SaveChangesAsync(cancellationToken) > 0;
    }

    public bool DoesCategoryExist(int? categoryId)
    {
        return categoryId.HasValue
               && categoryId.Value > 0
               && dbContext.Categories.AsNoTracking().Any(item => item.CategoryID == categoryId.Value);
    }

    public async Task<bool> DoesCategoryExistAsync(int? categoryId, CancellationToken cancellationToken = default)
    {
        return categoryId.HasValue
               && categoryId.Value > 0
               && await dbContext.Categories
                   .AsNoTracking()
                   .AnyAsync(item => item.CategoryID == categoryId.Value, cancellationToken);
    }

    public IReadOnlyList<CategoryModel> GetAllCategories()
    {
        var categories = dbContext.Categories
            .AsNoTracking()
            .Where(item => !item.IsDeleted)
            .OrderBy(item => item.CategoryID)
            .Select(ToModel);

        return [.. categories];
    }

    public async Task<IReadOnlyList<CategoryModel>> GetAllCategoriesAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
    {
        int safePage = Math.Max(1, pageNumber);
        int safeSize = Math.Clamp(pageSize, 1, 200);

        List<CategoryEntity> entities = await dbContext.Categories
            .AsNoTracking()
            .Where(item => !item.IsDeleted)
            .OrderBy(item => item.CategoryID)
            .Skip((safePage - 1) * safeSize)
            .Take(safeSize)
            .ToListAsync(cancellationToken);

        return [.. entities.Select(ToModel)];
    }

    private static CategoryModel ToModel(CategoryEntity entity)
    {
        return new CategoryModel(
            entity.CategoryID,
            entity.CategoryName,
            entity.CreatedAt,
            entity.IsDeleted,
            entity.NameAr,
            entity.Image
        );
    }
}
