using System.Globalization;
using Microsoft.EntityFrameworkCore;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.Application.Common;
using TijarahJoDB.DAL.Persistence;

namespace TijarahJoDB.DAL.Queries;

public sealed class SellerReadService : ISellerReadService
{
    private readonly TijarahJoDbContext _dbContext;

    public SellerReadService(TijarahJoDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public IReadOnlyList<TopSellerResult> GetTopSellers(int takeCount = 10)
    {
        int safeTake = Math.Clamp(takeCount, 1, 50);

        var rows = (
            from post in _dbContext.Posts.AsNoTracking()
            join user in _dbContext.Users.AsNoTracking() on post.UserID equals user.UserID
            where !user.IsDeleted && !post.IsDeleted
            group post by new
            {
                user.UserID,
                user.FirstName,
                user.LastName,
                user.Email,
                user.JoinDate
            }
            into grouped
            select new
            {
                grouped.Key.UserID,
                grouped.Key.FirstName,
                grouped.Key.LastName,
                grouped.Key.Email,
                grouped.Key.JoinDate,
                ActiveListingsCount = grouped.Count(post =>
                    post.Status == PostStatusPolicy.Active ||
                    post.Status == PostStatusPolicy.Sold),
                TotalSalesCount = grouped.Count(post => post.Status == PostStatusPolicy.Sold),
                TotalViews = grouped.Sum(post => (int?)post.Views) ?? 0
            }
        )
        .OrderByDescending(row => row.TotalSalesCount)
        .ThenByDescending(row => row.ActiveListingsCount)
        .ThenByDescending(row => row.TotalViews)
        .ThenBy(row => row.UserID)
        .Take(safeTake)
        .ToList();

        return rows.Select(row => new TopSellerResult
        {
            Id = row.UserID.ToString(CultureInfo.InvariantCulture),
            Name = BuildSellerName(row.FirstName, row.LastName, row.Email, row.UserID),
            Phone = string.Empty,
            City = string.Empty,
            Area = string.Empty,
            Avatar = string.Empty,
            JoinedDate = row.JoinDate.ToString("o"),
            ActiveListingsCount = row.ActiveListingsCount,
            TotalSalesCount = row.TotalSalesCount,
            TotalViews = row.TotalViews
        }).ToList();
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
