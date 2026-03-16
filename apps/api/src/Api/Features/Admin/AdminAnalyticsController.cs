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
        
        var weeklyUsers = new System.Collections.Generic.List<object>();
        var categoryData = new System.Collections.Generic.List<object>();

        // 1. Weekly users (last 7 days)
        try 
        {
            var usersPastWeek = await _dbContext.Users
                .AsNoTracking()
                .Where(u => !u.IsDeleted && u.JoinDate >= sevenDaysAgo)
                .Select(u => new { u.JoinDate })
                .ToListAsync(HttpContext.RequestAborted);

            weeklyUsers = Enumerable.Range(0, 7)
                .Select(i => sevenDaysAgo.AddDays(i).Date)
                .Select(date => (object)new
                {
                    Day = date.ToString("ddd"),
                    Count = usersPastWeek.Count(u => u.JoinDate.Date == date)
                })
                .ToList();
        }
        catch { /* swallow to keep dashboard alive */ }

        // 2. Posts by category
        try 
        {
            // Fetch category names to memory first
            var categories = await _dbContext.Categories
                .AsNoTracking()
                .Select(c => new { c.CategoryID, c.CategoryName })
                .ToListAsync(HttpContext.RequestAborted);
                
            var categoryDict = categories.ToDictionary(c => c.CategoryID, c => c.CategoryName);

            // Grouping in EF Core can be problematic; doing simple projection and grouping client-side
            var activePostsCategories = await _dbContext.Posts
                .AsNoTracking()
                .Where(p => !p.IsDeleted)
                .Select(p => p.CategoryID)
                .ToListAsync(HttpContext.RequestAborted);

            categoryData = activePostsCategories
                .GroupBy(c => c)
                .Select(g => new CategoryCountDto
                {
                    Name = categoryDict.TryGetValue(g.Key, out var name) ? name : "Unknown",
                    Count = g.Count()
                })
                .OrderByDescending(c => c.Count)
                .Take(10)
                .Cast<object>()
                .ToList();
        }
        catch { /* swallow */ }

        return Ok(new
        {
            WeeklyUsers = weeklyUsers,
            CategoryData = categoryData
        });
    }

    private class CategoryCountDto
    {
        public string Name { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}
