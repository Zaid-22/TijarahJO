using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TijarahJoDB.DAL.Persistence;
using TijarahJoDBAPI.Common.Authorization;

namespace TijarahJoDBAPI.Features.Admin;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/analytics")]
[Authorize(Policy = AuthorizationPolicies.AdminOnly)]
public class AdminAnalyticsController : ControllerBase
{
    private readonly TijarahJoDbContext _dbContext;

    public AdminAnalyticsController(TijarahJoDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <summary>
    /// Returns data for admin dashboard charts.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult> GetAnalytics()
    {
        var now = DateTime.UtcNow;
        var sevenDaysAgo = now.AddDays(-7);

        // 1. Weekly users (last 7 days)
        var usersPastWeek = await _dbContext.Users
            .AsNoTracking()
            .Where(u => !u.IsDeleted && u.JoinDate >= sevenDaysAgo)
            .Select(u => new { u.JoinDate })
            .ToListAsync(HttpContext.RequestAborted);

        var weeklyUsers = Enumerable.Range(0, 7)
            .Select(i => sevenDaysAgo.AddDays(i).Date)
            .Select(date => new
            {
                Day = date.ToString("ddd"),
                Count = usersPastWeek.Count(u => u.JoinDate.Date == date)
            })
            .ToList();

        // 2. Posts by category
        var categoryData = await _dbContext.Posts
            .AsNoTracking()
            .Where(p => !p.IsDeleted)
            .GroupBy(p => p.CategoryID)
            .Join(_dbContext.Categories, 
                  grouped => grouped.Key, 
                  cat => cat.CategoryID, 
                  (grouped, cat) => new 
                  {
                      Name = cat.CategoryName,
                      Count = grouped.Count()
                  })
            .OrderByDescending(c => c.Count)
            .Take(10) // Top 10 categories
            .ToListAsync(HttpContext.RequestAborted);

        return Ok(new
        {
            WeeklyUsers = weeklyUsers,
            CategoryData = categoryData
        });
    }
}
