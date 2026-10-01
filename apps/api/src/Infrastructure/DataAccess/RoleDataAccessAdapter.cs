using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Common;
using TijarahJo.Domain.Entities;
using TijarahJo.Infrastructure.Persistence;

namespace TijarahJo.Infrastructure.DataAccess;

public sealed class RoleDataAccessAdapter(TijarahJoDbContext dbContext, ILogger<RoleDataAccessAdapter> logger) : IRoleDataAccess
{
    private readonly TijarahJoDbContext _dbContext = dbContext;
    private readonly ILogger<RoleDataAccessAdapter> _logger = logger;

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
        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
            return entity.RoleID;
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Failed to add role {RoleName}", role.RoleName);
            return 0;
        }
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
        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Failed to update role {RoleId}", role.RoleID);
            return false;
        }
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
        try
        {
            return await _dbContext.SaveChangesAsync(cancellationToken) > 0;
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Failed to delete role {RoleId}", roleId);
            return false;
        }
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

    public async Task<bool> IsRoleNameTakenAsync(
        string roleName,
        int? excludeRoleId = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(roleName))
        {
            return false;
        }

        string normalizedRoleName = roleName.Trim();
        return await _dbContext.Roles
            .AsNoTracking()
            .AnyAsync(
                item => !item.IsDeleted
                        && item.RoleName == normalizedRoleName
                        && (!excludeRoleId.HasValue || item.RoleID != excludeRoleId.Value),
                cancellationToken);
    }

    public IReadOnlyList<RoleModel> GetAllRoles()
    {
        var roles = _dbContext.Roles
            .AsNoTracking()
            .Where(item => !item.IsDeleted)
            .OrderBy(item => item.RoleID)
            .Select(ToModel);

        return [.. roles];
    }

    public async Task<IReadOnlyList<RoleModel>> GetAllRolesAsync(CancellationToken cancellationToken = default)
    {
        List<RoleEntity> entities = await _dbContext.Roles
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
