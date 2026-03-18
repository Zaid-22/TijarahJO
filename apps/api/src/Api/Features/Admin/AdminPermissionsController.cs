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
[Authorize(Policy = AuthorizationPolicies.AdminOnly)]
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
        // Remove existing
        var existing = await _dbContext.RolePermissions
            .Where(rp => rp.RoleID == roleId)
            .ToListAsync(HttpContext.RequestAborted);
        _dbContext.RolePermissions.RemoveRange(existing);

        // Add new
        foreach (var permId in request.PermissionIds)
        {
            _dbContext.RolePermissions.Add(new TijarahJo.Domain.Entities.RolePermissionEntity
            {
                RoleID = roleId,
                PermissionID = permId
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
