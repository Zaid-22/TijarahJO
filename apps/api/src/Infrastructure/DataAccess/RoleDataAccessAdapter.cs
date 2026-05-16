using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Common;
using TijarahJo.Domain.Entities;
using TijarahJo.Infrastructure.Persistence;

namespace TijarahJo.Infrastructure.DataAccess;


public sealed class RoleDataAccessAdapter(TijarahJoDbContext dbContext) : IRoleDataAccess
{

    public RoleModel GetRoleByID(int? roleId)
    {
        if (!roleId.HasValue || roleId.Value < 1)
        {
            return null!;
        }

        RoleEntity? entity = dbContext.Roles
            .AsNoTracking()
            .FirstOrDefault(item => item.RoleID == roleId.Value);
        return entity is null ? null! : ToModel(entity);
    }

    public async Task<RoleModel> GetRoleByIDAsync(int? roleId, CancellationToken cancellationToken = default)
    {
        if (!roleId.HasValue || roleId.Value < 1)
        {
            return null!;
        }

        RoleEntity? entity = await dbContext.Roles
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.RoleID == roleId.Value, cancellationToken);
        return entity is null ? null! : ToModel(entity);
    }

    public async Task<int> AddRoleAsync(RoleModel role, CancellationToken cancellationToken = default)
    {
        var entity = new RoleEntity
        {
            RoleName = role.RoleName,
            CreatedAt = role.CreatedAt == default ? DateTime.UtcNow : role.CreatedAt,
            IsDeleted = role.IsDeleted
        };

        dbContext.Roles.Add(entity);
        dbContext.AuditActorUserId = null; // system operation
        await dbContext.SaveChangesAsync(cancellationToken);
        return entity.RoleID;
    }

    public async Task<bool> UpdateRoleAsync(RoleModel role, CancellationToken cancellationToken = default)
    {
        if (!role.RoleID.HasValue || role.RoleID.Value < 1)
        {
            return false;
        }

        RoleEntity? entity = await dbContext.Roles
            .FirstOrDefaultAsync(item => item.RoleID == role.RoleID.Value, cancellationToken);
        if (entity is null)
        {
            return false;
        }

        entity.RoleName = role.RoleName;
        entity.CreatedAt = role.CreatedAt == default ? entity.CreatedAt : role.CreatedAt;
        entity.IsDeleted = role.IsDeleted;

        dbContext.AuditActorUserId = null;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteRoleAsync(int? roleId, CancellationToken cancellationToken = default)
    {
        if (!roleId.HasValue || roleId.Value < 1)
        {
            return false;
        }

        RoleEntity? entity = await dbContext.Roles
            .FirstOrDefaultAsync(item => item.RoleID == roleId.Value, cancellationToken);
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

    public bool DoesRoleExist(int? roleId)
    {
        return roleId.HasValue
               && roleId.Value > 0
               && dbContext.Roles.AsNoTracking().Any(item => item.RoleID == roleId.Value);
    }

    public async Task<bool> DoesRoleExistAsync(int? roleId, CancellationToken cancellationToken = default)
    {
        return roleId.HasValue
               && roleId.Value > 0
               && await dbContext.Roles
                   .AsNoTracking()
                   .AnyAsync(item => item.RoleID == roleId.Value, cancellationToken);
    }

    public IReadOnlyList<RoleModel> GetAllRoles()
    {
        var roles = dbContext.Roles
            .AsNoTracking()
            .Where(item => !item.IsDeleted)
            .OrderBy(item => item.RoleID)
            .Select(ToModel);

        return [.. roles];
    }

    public async Task<IReadOnlyList<RoleModel>> GetAllRolesAsync(CancellationToken cancellationToken = default)
    {
        List<RoleEntity> entities = await dbContext.Roles
            .AsNoTracking()
            .Where(item => !item.IsDeleted)
            .OrderBy(item => item.RoleID)
            .ToListAsync(cancellationToken);

        return [.. entities.Select(ToModel)];
    }

    private static RoleModel ToModel(RoleEntity entity)
    {
        return new RoleModel(
            entity.RoleID,
            entity.RoleName,
            entity.CreatedAt,
            entity.IsDeleted
        );
    }
}
