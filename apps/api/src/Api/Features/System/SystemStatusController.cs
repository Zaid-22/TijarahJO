using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Api.Features.SystemStatus;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/system")]
[AllowAnonymous]
public sealed class SystemStatusController(
    ISystemSettingsRuntimeService systemSettingsRuntimeService) : ControllerBase
{
    private readonly ISystemSettingsRuntimeService _systemSettingsRuntimeService = systemSettingsRuntimeService;

    [HttpGet("status")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> GetStatus(CancellationToken cancellationToken)
    {
        PublicSystemStatus status =
            await _systemSettingsRuntimeService.GetPublicStatusAsync(cancellationToken);

        return Ok(status);
    }
}
