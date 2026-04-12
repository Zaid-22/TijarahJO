using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading;
using System.Threading.Tasks;
using TijarahJo.Api.Common.Services;
using TijarahJo.Api.Contracts.Requests;
using TijarahJo.Api.Contracts.Responses;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Api.Common.Authorization;

namespace TijarahJo.Api.Features.Admin;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/banners")]
[Authorize(Policy = AuthorizationPolicies.BannersManage)]
public sealed class AdminBannersController(IHeroBannerService heroBannerService) : ControllerBase
{
    private readonly IHeroBannerService _heroBannerService = heroBannerService;

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<HeroBannerListResult>> GetAllBanners(CancellationToken cancellationToken)
    {
        var result = await _heroBannerService.GetAllBannersAsync(cancellationToken);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { result.Message });
        
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<ActionResult> CreateBanner([FromBody] CreateHeroBannerCommand command, CancellationToken cancellationToken)
    {
        var result = await _heroBannerService.CreateBannerAsync(command, cancellationToken);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { result.Message });
            
        return CreatedAtAction(nameof(GetAllBanners), new { id = result.Banner?.BannerID }, result.Banner);
    }

    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> UpdateBanner(int id, [FromBody] CreateHeroBannerCommand command, CancellationToken cancellationToken)
    {
        var result = await _heroBannerService.UpdateBannerAsync(id, command, cancellationToken);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { result.Message });
            
        return Ok();
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> DeleteBanner(int id, CancellationToken cancellationToken)
    {
        var result = await _heroBannerService.DeleteBannerAsync(id, cancellationToken);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { result.Message });
            
        return Ok();
    }

    [HttpPatch("{id}/toggle")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> ToggleBannerActive(int id, CancellationToken cancellationToken)
    {
        var success = await _heroBannerService.ToggleBannerActiveAsync(id, cancellationToken);
        if (!success) return NotFound();
        return Ok();
    }

    [HttpPost("upload-image")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> UploadBannerImage(
        [FromForm] UploadHeroBannerImageRequest request,
        [FromServices] IPostImageFileStorageService storageService,
        CancellationToken cancellationToken)
    {
        IFormFile? file = request.File;
        if (file == null || file.Length == 0)
        {
            return BadRequest(new ApiMessageResponse { Message = "File is empty or not provided." });
        }

        try
        {
            var storedFile = await storageService.SaveAsync(file, cancellationToken);
            return Ok(new { Url = storedFile.PublicUrl });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ApiMessageResponse { Message = ex.Message });
        }
    }
}
