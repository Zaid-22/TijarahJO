using Microsoft.EntityFrameworkCore;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Infrastructure.Persistence;

namespace TijarahJo.Infrastructure.Queries;

public sealed class LocationReadService(TijarahJoDbContext dbContext) : ILocationReadService
{

    public async Task<IReadOnlyList<CityLookupResult>> GetCitiesAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.Cities
            .AsNoTracking()
            .OrderBy(city => city.CityName)
            .Select(city => new CityLookupResult
            {
                CityId = city.CityID,
                CityName = city.CityName,
                CityNameAr = city.CityNameAr
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<AreaLookupResult>> GetAreasByCityAsync(int cityId, CancellationToken cancellationToken = default)
    {
        return await dbContext.Areas
            .AsNoTracking()
            .Where(area => area.CityID == cityId)
            .OrderBy(area => area.AreaName)
            .Select(area => new AreaLookupResult
            {
                AreaId = area.AreaID,
                AreaName = area.AreaName,
                AreaNameAr = area.AreaNameAr,
                CityId = area.CityID
            })
            .ToListAsync(cancellationToken);
    }
}
