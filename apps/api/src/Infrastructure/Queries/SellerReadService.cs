using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Common;
using TijarahJo.Infrastructure.Persistence;

namespace TijarahJo.Infrastructure.Queries;

public sealed class SellerReadService(TijarahJoDbContext dbContext, IMemoryCache cache) : ISellerReadService
{

    public async Task<IReadOnlyList<TopSellerReadModel>> GetTopSellersAsync(int takeCount = 10, CancellationToken cancellationToken = default)
    {
        int safeTake = Math.Clamp(takeCount, 1, 50);

        string cacheKey = $"top-sellers|{safeTake}";
        if (cache.TryGetValue(cacheKey, out IReadOnlyList<TopSellerReadModel>? cached) && cached is not null)
        {
            return cached;
        }

        var rows = (
            from post in dbContext.Posts.AsNoTracking()
            join user in dbContext.Users.AsNoTracking() on post.UserID equals user.UserID
            join city in dbContext.Cities.AsNoTracking() on user.CityID equals city.CityID into cityJoin
            from city in cityJoin.DefaultIfEmpty()
            join area in dbContext.Areas.AsNoTracking() on user.AreaID equals area.AreaID into areaJoin
            from area in areaJoin.DefaultIfEmpty()
            where !user.IsDeleted && !post.IsDeleted
            group post by new
            {
                user.UserID,
                user.FirstName,
                user.LastName,
                user.Email,
                user.Avatar,
                user.JoinDate,
                CityName = city != null ? city.CityName : string.Empty,
                AreaName = area != null ? area.AreaName : string.Empty
            }
            into grouped
            select new
            {
                grouped.Key.UserID,
                grouped.Key.FirstName,
                grouped.Key.LastName,
                grouped.Key.Email,
                grouped.Key.Avatar,
                grouped.Key.JoinDate,
                grouped.Key.CityName,
                grouped.Key.AreaName,
                ActiveListingsCount = grouped.Count(post =>
                    post.Status == PostStatusPolicy.Active ||
                    post.Status == PostStatusPolicy.Sold),
                TotalSalesCount = grouped.Count(post => post.Status == PostStatusPolicy.Sold),
                TotalViews = grouped.Sum(post => (long?)post.Views) ?? 0L
            }
        )
        .OrderByDescending(row => row.TotalSalesCount)
        .ThenByDescending(row => row.ActiveListingsCount)
        .ThenByDescending(row => row.TotalViews)
        .ThenBy(row => row.UserID)
        .Take(safeTake)
        .ToListAsync(cancellationToken);

        var sellerModels = (await rows).Select(row => new TopSellerReadModel
        {
            Id = row.UserID.ToString(CultureInfo.InvariantCulture),
            Name = BuildSellerName(row.FirstName, row.LastName, row.Email, row.UserID),
            Phone = string.Empty,
            City = row.CityName,
            Area = row.AreaName,
            Avatar = row.Avatar ?? string.Empty,
            JoinedDate = row.JoinDate.ToString("o"),
            ActiveListingsCount = row.ActiveListingsCount,
            TotalSalesCount = row.TotalSalesCount,
            TotalViews = row.TotalViews
        });

        IReadOnlyList<TopSellerReadModel> results = [.. sellerModels];

        cache.Set(
            cacheKey,
            results,
            new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(60)
            });

        return results;
    }

    private static string BuildSellerName(string firstName, string? lastName, string email, int userId)
    {
        string displayName = $"{firstName} {lastName}".Trim();
        if (!string.IsNullOrWhiteSpace(displayName))
        {
            return displayName;
        }

        if (!string.IsNullOrWhiteSpace(email))
        {
            return email;
        }

        return $"User {userId}";
    }
}
