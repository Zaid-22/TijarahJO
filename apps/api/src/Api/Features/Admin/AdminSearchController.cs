using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TijarahJo.Infrastructure.Persistence;
using TijarahJo.Api.Common.Authorization;

namespace TijarahJo.Api.Features.Admin;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/search")]
[Authorize(Policy = AuthorizationPolicies.AdminAccess)]
public class AdminSearchController : ControllerBase
{
    private readonly TijarahJoDbContext _dbContext;

    public AdminSearchController(TijarahJoDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> Search([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
            return Ok(new AdminSearchResult());

        var term = q.Trim().ToLower();
        int maxResults = 5;

        // Search Users
        var users = await _dbContext.Users
            .AsNoTracking()
            .Where(u => !u.IsDeleted &&
                (u.FirstName.Contains(term, StringComparison.CurrentCultureIgnoreCase) ||
                 (u.LastName != null && u.LastName.Contains(term, StringComparison.CurrentCultureIgnoreCase)) ||
                 u.Email.Contains(term, StringComparison.CurrentCultureIgnoreCase)))
            .OrderBy(u => u.FirstName)
            .Take(maxResults)
            .Select(u => new SearchResultItem
            {
                Id = u.UserID,
                Type = "USER",
                Title = (u.FirstName + " " + (u.LastName ?? "")).Trim(),
                Subtitle = u.Email
            })
            .ToListAsync(HttpContext.RequestAborted);

        // Search Posts
        var posts = await _dbContext.Posts
            .AsNoTracking()
            .Where(p => !p.IsDeleted && p.PostTitle.Contains(term, StringComparison.CurrentCultureIgnoreCase))
            .OrderByDescending(p => p.CreatedAt)
            .Take(maxResults)
            .Select(p => new SearchResultItem
            {
                Id = p.PostID,
                Type = "LISTING",
                Title = p.PostTitle,
                Subtitle = $"#{p.PostID} • {(p.Price.HasValue ? "$" + p.Price.Value.ToString("N0") : "N/A")}"
            })
            .ToListAsync(HttpContext.RequestAborted);

        // Search Categories
        var categories = await _dbContext.Categories
            .AsNoTracking()
            .Where(c => !c.IsDeleted && c.CategoryName.Contains(term, StringComparison.CurrentCultureIgnoreCase))
            .OrderBy(c => c.CategoryName)
            .Take(maxResults)
            .Select(c => new SearchResultItem
            {
                Id = c.CategoryID,
                Type = "CATEGORY",
                Title = c.CategoryName,
                Subtitle = "Category"
            })
            .ToListAsync(HttpContext.RequestAborted);

        return Ok(new AdminSearchResult
        {
            Users = users,
            Posts = posts,
            Categories = categories
        });
    }
}

public sealed class AdminSearchResult
{
    public List<SearchResultItem> Users { get; set; } = new();
    public List<SearchResultItem> Posts { get; set; } = new();
    public List<SearchResultItem> Categories { get; set; } = new();
}

public sealed class SearchResultItem
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
}
