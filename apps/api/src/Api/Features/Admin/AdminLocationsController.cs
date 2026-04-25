using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Api.Common.Authorization;

namespace TijarahJo.Api.Features.Admin;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/locations")]
[Authorize(Policy = AuthorizationPolicies.LocationsManage)]
public class AdminLocationsController(IAdminLocationDataAccess locationDataAccess) : ControllerBase
{
    private readonly IAdminLocationDataAccess _adminDataAccess = locationDataAccess;

    [HttpGet("cities")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> GetCities()
    {
        var cities = await _adminDataAccess.GetCitiesWithAreasAsync(HttpContext.RequestAborted);
        return Ok(cities);
    }

    [HttpPost("cities")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult> CreateCity([FromBody] CityRequest request)
    {
        if (string.IsNullOrWhiteSpace(request?.Name) || string.IsNullOrWhiteSpace(request?.NameAr))
            return BadRequest("City name and Arabic name are required.");

        try
        {
            int cityId = await _adminDataAccess.CreateCityAsync(request.Name, request.NameAr, HttpContext.RequestAborted);
            return Created($"/api/v1/admin/locations/cities/{cityId}", new { CityID = cityId });
        }
        catch (DbUpdateException)
        {
            return Conflict(new { Message = $"A city with the name '{request.Name}' already exists." });
        }
    }

    [HttpPut("cities/{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult> UpdateCity(int id, [FromBody] CityRequest request)
    {
        if (string.IsNullOrWhiteSpace(request?.Name) || string.IsNullOrWhiteSpace(request?.NameAr))
            return BadRequest("City name and Arabic name are required.");

        try
        {
            bool updated = await _adminDataAccess.UpdateCityAsync(id, request.Name, request.NameAr, HttpContext.RequestAborted);
            if (!updated) return NotFound();
            return Ok(new { Message = "City updated." });
        }
        catch (DbUpdateException)
        {
            return Conflict(new { Message = $"A city with the name '{request.Name}' already exists." });
        }
    }

    [HttpDelete("cities/{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult> DeleteCity(int id)
    {
        try
        {
            bool deleted = await _adminDataAccess.DeleteCityAsync(id, HttpContext.RequestAborted);
            if (!deleted) return NotFound();
            return Ok(new { Message = "City deleted." });
        }
        catch (DbUpdateException)
        {
            return Conflict(new { Message = "Cannot delete this city because it is referenced by users or posts. Remove those references first." });
        }
    }

    [HttpPost("areas")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult> CreateArea([FromBody] AreaRequest request)
    {
        if (string.IsNullOrWhiteSpace(request?.Name) || string.IsNullOrWhiteSpace(request?.NameAr) || request.CityID < 1)
            return BadRequest("City ID, area name, and Arabic name are required.");

        try
        {
            int areaId = await _adminDataAccess.CreateAreaAsync(request.CityID, request.Name, request.NameAr, HttpContext.RequestAborted);
            return Created($"/api/v1/admin/locations/areas/{areaId}", new { AreaID = areaId });
        }
        catch (DbUpdateException)
        {
            return Conflict(new { Message = $"An area with the name '{request.Name}' already exists in this city, or the city does not exist." });
        }
    }

    [HttpPut("areas/{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult> UpdateArea(int id, [FromBody] AreaRequest request)
    {
        if (string.IsNullOrWhiteSpace(request?.Name) || string.IsNullOrWhiteSpace(request?.NameAr))
            return BadRequest("Area name and Arabic name are required.");

        try
        {
            bool updated = await _adminDataAccess.UpdateAreaAsync(id, request.Name, request.NameAr, HttpContext.RequestAborted);
            if (!updated) return NotFound();
            return Ok(new { Message = "Area updated." });
        }
        catch (DbUpdateException)
        {
            return Conflict(new { Message = $"An area with the name '{request.Name}' already exists in this city." });
        }
    }

    [HttpDelete("areas/{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult> DeleteArea(int id)
    {
        try
        {
            bool deleted = await _adminDataAccess.DeleteAreaAsync(id, HttpContext.RequestAborted);
            if (!deleted) return NotFound();
            return Ok(new { Message = "Area deleted." });
        }
        catch (DbUpdateException)
        {
            return Conflict(new { Message = "Cannot delete this area because it is referenced by users or posts. Remove those references first." });
        }
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
