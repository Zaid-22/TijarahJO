using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;
using System.Threading;
using System.Threading.Tasks;
using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Api.Features.Banners;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/banners")]
public sealed class BannersController(IHeroBannerService heroBannerService) : ControllerBase
{
    private readonly IHeroBannerService _heroBannerService = heroBannerService;

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<HeroBannerListResult>> GetActiveBanners(CancellationToken cancellationToken)
    {
        var result = await _heroBannerService.GetActiveBannersAsync(cancellationToken);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { result.Message });
            
        return Ok(result);
    }
}
