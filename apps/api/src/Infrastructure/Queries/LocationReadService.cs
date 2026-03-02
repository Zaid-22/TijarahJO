using Microsoft.EntityFrameworkCore;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.DAL.Persistence;

namespace TijarahJoDB.DAL.Queries;

public sealed class LocationReadService : ILocationReadService
{
    private readonly TijarahJoDbContext _dbContext;

    public LocationReadService(TijarahJoDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<CityLookupResult>> GetCitiesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Cities
            .AsNoTracking()
            .OrderBy(city => city.CityName)
            .Select(city => new CityLookupResult
            {
                CityId = city.CityID,
                CityName = city.CityName
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<AreaLookupResult>> GetAreasByCityAsync(int cityId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Areas
            .AsNoTracking()
            .Where(area => area.CityID == cityId)
            .OrderBy(area => area.AreaName)
            .Select(area => new AreaLookupResult
            {
                AreaId = area.AreaID,
                AreaName = area.AreaName,
                CityId = area.CityID
            })
            .ToListAsync(cancellationToken);
    }
}
