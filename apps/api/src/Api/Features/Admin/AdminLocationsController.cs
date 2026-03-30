using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Api.Common.Authorization;

namespace TijarahJo.Api.Features.Admin;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/locations")]
[Authorize(Policy = AuthorizationPolicies.LocationsManage)]
public class AdminLocationsController : ControllerBase
{
    private readonly IAdminDataAccess _adminDataAccess;

    public AdminLocationsController(IAdminDataAccess adminDataAccess)
    {
        _adminDataAccess = adminDataAccess;
    }

    [HttpGet("cities")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> GetCities()
    {
        var cities = await _adminDataAccess.GetCitiesWithAreasAsync(HttpContext.RequestAborted);
        return Ok(cities);
    }

    [HttpPost("cities")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<ActionResult> CreateCity([FromBody] CityRequest request)
    {
        if (string.IsNullOrWhiteSpace(request?.Name) || string.IsNullOrWhiteSpace(request?.NameAr))
            return BadRequest("City name and Arabic name are required.");

        int cityId = await _adminDataAccess.CreateCityAsync(request.Name, request.NameAr, HttpContext.RequestAborted);
        return Created($"/api/v1/admin/locations/cities/{cityId}", new { CityID = cityId });
    }

    [HttpPut("cities/{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> UpdateCity(int id, [FromBody] CityRequest request)
    {
        if (string.IsNullOrWhiteSpace(request?.Name) || string.IsNullOrWhiteSpace(request?.NameAr))
            return BadRequest("City name and Arabic name are required.");

        bool updated = await _adminDataAccess.UpdateCityAsync(id, request.Name, request.NameAr, HttpContext.RequestAborted);
        if (!updated) return NotFound();
        return Ok(new { Message = "City updated." });
    }

    [HttpDelete("cities/{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteCity(int id)
    {
        bool deleted = await _adminDataAccess.DeleteCityAsync(id, HttpContext.RequestAborted);
        if (!deleted) return NotFound();
        return Ok(new { Message = "City deleted." });
    }

    [HttpPost("areas")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<ActionResult> CreateArea([FromBody] AreaRequest request)
    {
        if (string.IsNullOrWhiteSpace(request?.Name) || string.IsNullOrWhiteSpace(request?.NameAr) || request.CityID < 1)
            return BadRequest("City ID, area name, and Arabic name are required.");

        int areaId = await _adminDataAccess.CreateAreaAsync(request.CityID, request.Name, request.NameAr, HttpContext.RequestAborted);
        return Created($"/api/v1/admin/locations/areas/{areaId}", new { AreaID = areaId });
    }

    [HttpPut("areas/{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> UpdateArea(int id, [FromBody] AreaRequest request)
    {
        if (string.IsNullOrWhiteSpace(request?.Name) || string.IsNullOrWhiteSpace(request?.NameAr))
            return BadRequest("Area name and Arabic name are required.");

        bool updated = await _adminDataAccess.UpdateAreaAsync(id, request.Name, request.NameAr, HttpContext.RequestAborted);
        if (!updated) return NotFound();
        return Ok(new { Message = "Area updated." });
    }

    [HttpDelete("areas/{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteArea(int id)
    {
        bool deleted = await _adminDataAccess.DeleteAreaAsync(id, HttpContext.RequestAborted);
        if (!deleted) return NotFound();
        return Ok(new { Message = "Area deleted." });
    }
}

public sealed class CityRequest
{
    public string Name { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
}

public sealed class AreaRequest
{
    public int CityID { get; set; }
    public string Name { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
}
