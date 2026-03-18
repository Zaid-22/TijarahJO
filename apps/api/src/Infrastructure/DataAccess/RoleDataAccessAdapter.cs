using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using TijarahJo.Domain.Models;
using TijarahJoDB.Application.Abstractions.DataAccess;
using TijarahJoDB.Application.Common;
using TijarahJoDB.DAL.Entities;
using TijarahJoDB.DAL.Persistence;

namespace TijarahJo.Infrastructure.DataAccess;


public sealed class RoleDataAccessAdapter : IRoleDataAccess
{
    private readonly TijarahJoDbContext _dbContext;

    public RoleDataAccessAdapter(TijarahJoDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public RoleModel GetRoleByID(int? roleId)
    {
        if (!roleId.HasValue || roleId.Value < 1)
        {
            return null!;
        }

        RoleEntity? entity = _dbContext.Roles
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

        RoleEntity? entity = await _dbContext.Roles
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

        _dbContext.Roles.Add(entity);
        _dbContext.AuditActorUserId = null; // system operation
        await _dbContext.SaveChangesAsync(cancellationToken);
        return entity.RoleID;
    }

    public async Task<bool> UpdateRoleAsync(RoleModel role, CancellationToken cancellationToken = default)
    {
        if (!role.RoleID.HasValue || role.RoleID.Value < 1)
        {
            return false;
        }

        RoleEntity? entity = await _dbContext.Roles
            .FirstOrDefaultAsync(item => item.RoleID == role.RoleID.Value, cancellationToken);
        if (entity is null)
        {
            return false;
        }

        entity.RoleName = role.RoleName;
        entity.CreatedAt = role.CreatedAt == default ? entity.CreatedAt : role.CreatedAt;
        entity.IsDeleted = role.IsDeleted;

        _dbContext.AuditActorUserId = null;
        return await _dbContext.SaveChangesAsync(cancellationToken) > 0;
    }

    public async Task<bool> DeleteRoleAsync(int? roleId, CancellationToken cancellationToken = default)
    {
        if (!roleId.HasValue || roleId.Value < 1)
        {
            return false;
        }

        RoleEntity? entity = await _dbContext.Roles
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
        _dbContext.AuditActorUserId = null;
        return await _dbContext.SaveChangesAsync(cancellationToken) > 0;
    }

    public bool DoesRoleExist(int? roleId)
    {
        return roleId.HasValue
               && roleId.Value > 0
               && _dbContext.Roles.AsNoTracking().Any(item => item.RoleID == roleId.Value);
    }

    public async Task<bool> DoesRoleExistAsync(int? roleId, CancellationToken cancellationToken = default)
    {
        return roleId.HasValue
               && roleId.Value > 0
               && await _dbContext.Roles
                   .AsNoTracking()
                   .AnyAsync(item => item.RoleID == roleId.Value, cancellationToken);
    }

    public IReadOnlyList<RoleModel> GetAllRoles()
    {
        return _dbContext.Roles
            .AsNoTracking()
            .Where(item => !item.IsDeleted)
            .OrderBy(item => item.RoleID)
            .Select(ToModel)
            .ToList();
    }

    public async Task<IReadOnlyList<RoleModel>> GetAllRolesAsync(CancellationToken cancellationToken = default)
    {
        List<RoleEntity> entities = await _dbContext.Roles
            .AsNoTracking()
            .Where(item => !item.IsDeleted)
            .OrderBy(item => item.RoleID)
            .ToListAsync(cancellationToken);

        return entities.Select(ToModel).ToList();
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
