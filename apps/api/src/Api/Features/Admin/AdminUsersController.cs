using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Infrastructure.Persistence;
using TijarahJo.Api.Common.Authorization;

namespace TijarahJo.Api.Features.Admin;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/users")]
[Authorize(Policy = AuthorizationPolicies.AdminOnly)]
public class AdminUsersController : ControllerBase
{
    private readonly IAdminQueryHandler _adminQueries;
    private readonly TijarahJoDbContext _dbContext;

    public AdminUsersController(IAdminQueryHandler adminQueries, TijarahJoDbContext dbContext)
    {
        _adminQueries = adminQueries;
        _dbContext = dbContext;
    }

    [HttpGet("{id}/details")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<AdminUserDetails>> GetAdminUserDetails(int id)
    {
        var result = await _adminQueries.GetAdminUserDetailsAsync(id, HttpContext.RequestAborted);
        if (!result.Success || result.Result == null)
        {
            return Problem(
                statusCode: result.StatusCode,
                title: "ADMIN_USER_DETAILS_FAILED",
                detail: result.Message
            );
        }

        return Ok(result.Result);
    }

    /// <summary>Bulk update user statuses (ban or activate multiple users at once).</summary>
    [HttpPut("bulk-status")]
    public async Task<ActionResult> BulkUpdateUserStatus([FromBody] BulkUserStatusRequest request)
    {
        if (request.UserIds == null || request.UserIds.Count == 0)
        {
            return BadRequest(new { Message = "No user IDs provided." });
        }

        // Map status string to StatusID
        int newStatusId = request.Status?.ToLowerInvariant() switch
        {
            "banned" => 2,
            "active" => 1,
            _ => 0
        };

        if (newStatusId == 0)
        {
            return BadRequest(new { Message = "Invalid status. Use 'banned' or 'active'." });
        }

        var userIds = request.UserIds
            .Select(id => int.TryParse(id, out var parsed) ? parsed : -1)
            .Where(id => id > 0)
            .ToList();

        var users = await _dbContext.Users
            .Where(u => userIds.Contains(u.UserID) && !u.IsDeleted)
            .ToListAsync(HttpContext.RequestAborted);

        foreach (var user in users)
        {
            user.Status = newStatusId;
        }

        await _dbContext.SaveChangesAsync(HttpContext.RequestAborted);

        return Ok(new { Message = $"{users.Count} users updated to {request.Status}.", AffectedCount = users.Count });
    }
}

public sealed class BulkUserStatusRequest
{
    public List<string> UserIds { get; set; } = new();
    public string? Status { get; set; }
}
