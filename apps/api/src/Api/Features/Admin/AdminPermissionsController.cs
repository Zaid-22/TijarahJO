using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TijarahJo.Infrastructure.Persistence;
using TijarahJo.Api.Common.Authorization;

namespace TijarahJo.Api.Features.Admin;

/// <summary>
/// Admin endpoint for managing granular permissions and role-permission assignments.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/permissions")]
[Authorize(Policy = AuthorizationPolicies.RolesManage)]
public class AdminPermissionsController : ControllerBase
{
    private readonly TijarahJoDbContext _dbContext;

    public AdminPermissionsController(TijarahJoDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <summary>Get all permissions grouped by category.</summary>
    [HttpGet]
    public async Task<ActionResult> GetPermissions()
    {
        var permissions = await _dbContext.Permissions
            .AsNoTracking()
            .OrderBy(p => p.Category)
            .ThenBy(p => p.PermissionKey)
            .Select(p => new
            {
                p.PermissionID,
                p.PermissionKey,
                p.Description,
                p.Category
            })
            .ToListAsync(HttpContext.RequestAborted);

        return Ok(permissions);
    }

    /// <summary>Get permissions assigned to a specific role.</summary>
    [HttpGet("role/{roleId}")]
    public async Task<ActionResult> GetRolePermissions(int roleId)
    {
        var permissionIds = await _dbContext.RolePermissions
            .AsNoTracking()
            .Where(rp => rp.RoleID == roleId)
            .Select(rp => rp.PermissionID)
            .ToListAsync(HttpContext.RequestAborted);

        return Ok(permissionIds);
    }

    /// <summary>Assign a set of permissions to a role (replaces existing).</summary>
    [HttpPut("role/{roleId}")]
    public async Task<ActionResult> UpdateRolePermissions(int roleId, [FromBody] UpdateRolePermissionsRequest request)
    {
        bool roleExists = await _dbContext.Roles
            .AsNoTracking()
            .AnyAsync(role => role.RoleID == roleId, HttpContext.RequestAborted);

        if (!roleExists)
        {
            return NotFound(new { Message = "Role not found." });
        }

        var requestedPermissionIds = RolePermissionUpdatePlanner.Create(
            existingPermissionIds: [],
            requestedPermissionIds: request.PermissionIds).NormalizedPermissionIds;

        if (requestedPermissionIds.Count > 0)
        {
            var validPermissionIds = await _dbContext.Permissions
                .AsNoTracking()
                .Where(permission => requestedPermissionIds.Contains(permission.PermissionID))
                .Select(permission => permission.PermissionID)
                .ToListAsync(HttpContext.RequestAborted);

            var invalidPermissionIds = requestedPermissionIds
                .Except(validPermissionIds)
                .OrderBy(permissionId => permissionId)
                .ToArray();

            if (invalidPermissionIds.Length > 0)
            {
                return BadRequest(new
                {
                    Message = $"Unknown permission IDs: {string.Join(", ", invalidPermissionIds)}."
                });
            }
        }

        var existing = await _dbContext.RolePermissions
            .Where(rp => rp.RoleID == roleId)
            .ToListAsync(HttpContext.RequestAborted);

        RolePermissionUpdatePlan updatePlan = RolePermissionUpdatePlanner.Create(
            existing.Select(rolePermission => rolePermission.PermissionID),
            requestedPermissionIds);

        var rolePermissionsToRemove = existing
            .Where(rolePermission => updatePlan.PermissionIdsToRemove.Contains(rolePermission.PermissionID))
            .ToList();

        if (rolePermissionsToRemove.Count > 0)
        {
            _dbContext.RolePermissions.RemoveRange(rolePermissionsToRemove);
        }

        foreach (int permissionId in updatePlan.PermissionIdsToAdd)
        {
            _dbContext.RolePermissions.Add(new TijarahJo.Domain.Entities.RolePermissionEntity
            {
                RoleID = roleId,
                PermissionID = permissionId
            });
        }

        await _dbContext.SaveChangesAsync(HttpContext.RequestAborted);
        return Ok(new { Message = "Role permissions updated." });
    }
}

public sealed class UpdateRolePermissionsRequest
{
    public List<int> PermissionIds { get; set; } = new();
}
