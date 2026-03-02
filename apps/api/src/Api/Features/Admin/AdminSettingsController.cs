using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDBAPI.Common.Authorization;

namespace TijarahJoDBAPI.Features.Admin;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/settings")]
[Authorize(Policy = AuthorizationPolicies.AdminOnly)]
public class AdminSettingsController : ControllerBase
{
    private readonly IAdminQueryHandler _adminQueries;

    public AdminSettingsController(IAdminQueryHandler adminQueries)
    {
        _adminQueries = adminQueries;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> GetAllSettings()
    {
        var result = await _adminQueries.GetAllSettingsAsync(HttpContext.RequestAborted);
        if (!result.Success)
        {
            return Problem(statusCode: result.StatusCode, title: "SETTINGS_FAILED", detail: result.Message);
        }
        return Ok(result.Settings);
    }

    [HttpPut("{key}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> UpdateSetting(string key, [FromBody] UpdateSettingRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(key) || request == null)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Invalid request.");
        }

        var result = await _adminQueries.UpdateSettingAsync(key, request.Value, cancellationToken);
        if (result.Success)
        {
            return Ok(new { Message = result.Message });
        }

        return Problem(statusCode: result.StatusCode, title: "SETTING_UPDATE_FAILED", detail: result.Message);
    }
}

public sealed class UpdateSettingRequest
{
    public string Value { get; set; } = string.Empty;
}
