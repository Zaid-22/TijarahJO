using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Api.Contracts.Responses;

namespace TijarahJo.Api.Features.Locations;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}")]
public sealed class LocationsController(ILocationReadService locations) : ControllerBase
{
    private readonly ILocationReadService _locations = locations;

    [HttpGet("cities")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<List<CityResponseDTO>>> GetCities(CancellationToken cancellationToken)
    {
        var cities = await _locations.GetCitiesAsync(cancellationToken);
        return Ok(cities.Select(city => new CityResponseDTO
        {
            CityId = city.CityId,
            CityName = city.CityName,
            CityNameAr = city.CityNameAr
        }).ToList());
    }

    [HttpGet("cities/{cityId:int}/areas")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<List<AreaResponseDTO>>> GetAreasByCity(int cityId, CancellationToken cancellationToken)
    {
        if (cityId < 1)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Invalid city ID.");
        }

        var areas = await _locations.GetAreasByCityAsync(cityId, cancellationToken);
        return Ok(areas.Select(area => new AreaResponseDTO
        {
            AreaId = area.AreaId,
            AreaName = area.AreaName,
            AreaNameAr = area.AreaNameAr,
            CityId = area.CityId
        }).ToList());
    }
}
