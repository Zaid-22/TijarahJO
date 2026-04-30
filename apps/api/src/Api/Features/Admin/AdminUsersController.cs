using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Api.Common.Authorization;

namespace TijarahJo.Api.Features.Admin;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/users")]
public class AdminUsersController(IAdminQueryHandler adminQueries, IAdminDataAccess adminData) : ControllerBase
{
    private readonly IAdminQueryHandler _adminQueries = adminQueries;
    private readonly IAdminDataAccess _adminData = adminData;

    [HttpGet("{id}/details")]
    [Authorize(Policy = AuthorizationPolicies.UsersView)]
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
    [Authorize(Policy = AuthorizationPolicies.UsersManage)]
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

        int affectedCount = await _adminData.BulkUpdateUserStatusAsync(userIds, newStatusId, HttpContext.RequestAborted);

        return Ok(new { Message = $"{affectedCount} users updated to {request.Status}.", AffectedCount = affectedCount });
    }

    /// <summary>Suspend a user for a set duration (hours) or permanently (null).</summary>
    [HttpPost("{id}/suspend")]
    [Authorize(Policy = AuthorizationPolicies.UsersManage)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> SuspendUser(int id, [FromBody] SuspendUserRequest request)
    {
        if (request.DurationHours.HasValue &&
            (!double.IsFinite(request.DurationHours.Value) || request.DurationHours.Value <= 0))
        {
            return BadRequest(new { Message = "DurationHours must be greater than 0, or null for a permanent ban." });
        }

        int adminUserId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

        DateTime? suspendedUntil = request.DurationHours.HasValue
            ? DateTime.UtcNow.AddHours(request.DurationHours.Value)
            : null; // permanent ban

        bool success = await _adminData.SuspendUserAsync(id, suspendedUntil, adminUserId, HttpContext.RequestAborted);
        if (!success)
            return NotFound(new { Message = "User not found." });

        string message = suspendedUntil.HasValue
            ? $"User suspended until {suspendedUntil.Value:yyyy-MM-dd HH:mm} UTC."
            : "User permanently banned.";

        return Ok(new { Message = message, SuspendedUntil = suspendedUntil });
    }
}

public sealed class BulkUserStatusRequest
{
    public List<string> UserIds { get; set; } = [];
    public string? Status { get; set; }
}

public sealed class SuspendUserRequest
{
    /// <summary>Hours to suspend. Null = permanent ban.</summary>
    public double? DurationHours { get; set; }
}
