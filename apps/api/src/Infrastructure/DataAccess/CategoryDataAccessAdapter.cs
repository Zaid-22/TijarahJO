using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using Models;
using TijarahJoDB.Application.Abstractions.DataAccess;
using TijarahJoDB.Application.Common;
using TijarahJoDB.DAL.Entities;
using TijarahJoDB.DAL.Persistence;

namespace TijarahJoDB_DataAccess;


public sealed class CategoryDataAccessAdapter : ICategoryDataAccess
{
    private readonly TijarahJoDbContext _dbContext;

    public CategoryDataAccessAdapter(TijarahJoDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public CategoryModel GetCategoryByID(int? categoryId)
    {
        if (!categoryId.HasValue || categoryId.Value < 1)
        {
            return null!;
        }

        CategoryEntity? entity = _dbContext.Categories
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

        CategoryEntity? entity = await _dbContext.Categories
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
            Icon = category.Icon,
            Color = category.Color,
            Image = category.Image,
            CreatedAt = category.CreatedAt == default ? DateTime.UtcNow : category.CreatedAt,
            IsDeleted = category.IsDeleted
        };

        _dbContext.Categories.Add(entity);
        _dbContext.AuditActorUserId = null; // admin-only operation; actor set by command service if needed
        await _dbContext.SaveChangesAsync(cancellationToken);
        return entity.CategoryID;
    }

    public async Task<bool> UpdateCategoryAsync(CategoryModel category, CancellationToken cancellationToken = default)
    {
        if (!category.CategoryID.HasValue || category.CategoryID.Value < 1)
        {
            return false;
        }

        CategoryEntity? entity = await _dbContext.Categories
            .FirstOrDefaultAsync(item => item.CategoryID == category.CategoryID.Value, cancellationToken);
        if (entity is null)
        {
            return false;
        }

        entity.CategoryName = category.CategoryName;
        entity.NameAr = category.NameAr;
        entity.Icon = category.Icon;
        entity.Color = category.Color;
        entity.Image = category.Image;
        entity.CreatedAt = category.CreatedAt == default ? entity.CreatedAt : category.CreatedAt;
        entity.IsDeleted = category.IsDeleted;

        _dbContext.AuditActorUserId = null;
        return await _dbContext.SaveChangesAsync(cancellationToken) > 0;
    }

    public async Task<bool> DeleteCategoryAsync(int? categoryId, CancellationToken cancellationToken = default)
    {
        if (!categoryId.HasValue || categoryId.Value < 1)
        {
            return false;
        }

        CategoryEntity? entity = await _dbContext.Categories
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
        _dbContext.AuditActorUserId = null;
        return await _dbContext.SaveChangesAsync(cancellationToken) > 0;
    }

    public bool DoesCategoryExist(int? categoryId)
    {
        return categoryId.HasValue
               && categoryId.Value > 0
               && _dbContext.Categories.AsNoTracking().Any(item => item.CategoryID == categoryId.Value);
    }

    public async Task<bool> DoesCategoryExistAsync(int? categoryId, CancellationToken cancellationToken = default)
    {
        return categoryId.HasValue
               && categoryId.Value > 0
               && await _dbContext.Categories
                   .AsNoTracking()
                   .AnyAsync(item => item.CategoryID == categoryId.Value, cancellationToken);
    }

    public IReadOnlyList<CategoryModel> GetAllCategories()
    {
        return _dbContext.Categories
            .AsNoTracking()
            .Where(item => !item.IsDeleted)
            .OrderBy(item => item.CategoryID)
            .Select(ToModel)
            .ToList();
    }

    public async Task<IReadOnlyList<CategoryModel>> GetAllCategoriesAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
    {
        int safePage = Math.Max(1, pageNumber);
        int safeSize = Math.Clamp(pageSize, 1, 200);

        List<CategoryEntity> entities = await _dbContext.Categories
            .AsNoTracking()
            .Where(item => !item.IsDeleted)
            .OrderBy(item => item.CategoryID)
            .Skip((safePage - 1) * safeSize)
            .Take(safeSize)
            .ToListAsync(cancellationToken);

        return entities.Select(ToModel).ToList();
    }

    private static CategoryModel ToModel(CategoryEntity entity)
    {
        return new CategoryModel(
            entity.CategoryID,
            entity.CategoryName,
            entity.CreatedAt,
            entity.IsDeleted,
            entity.NameAr,
            entity.Icon,
            entity.Color,
            entity.Image
        );
    }
}
