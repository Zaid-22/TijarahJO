using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TijarahJo.Infrastructure.Persistence;
using TijarahJo.Api.Common.Authorization;
using System.Text.Json.Serialization;

namespace TijarahJo.Api.Features.Admin;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/search")]
[Authorize(Policy = AuthorizationPolicies.AdminAccess)]
public class AdminSearchController(TijarahJoDbContext dbContext) : ControllerBase
{
    private readonly TijarahJoDbContext _dbContext = dbContext;

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
                (EF.Functions.Like(u.FirstName, $"%{term}%") ||
                 (u.LastName != null && EF.Functions.Like(u.LastName, $"%{term}%")) ||
                 EF.Functions.Like(u.Email, $"%{term}%") ||
                 (u.Phone != null && EF.Functions.Like(u.Phone, $"%{term}%"))))
            .OrderBy(u => u.FirstName)
            .Take(maxResults)
            .Select(u => new SearchResultItem
            {
                Id = u.UserID,
                Type = "USER",
                Title = (u.FirstName + " " + (u.LastName ?? "")).Trim(),
                Subtitle = u.Phone == null || u.Phone == string.Empty
                    ? u.Email
                    : u.Email + " • " + u.Phone
            })
            .ToListAsync(HttpContext.RequestAborted);

        // Search Posts
        var posts = await _dbContext.Posts
            .AsNoTracking()
            .Where(p => !p.IsDeleted && EF.Functions.Like(p.PostTitle, $"%{term}%"))
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
            .Where(c => !c.IsDeleted && EF.Functions.Like(c.CategoryName, $"%{term}%"))
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
    [JsonPropertyName("users")]
    public List<SearchResultItem> Users { get; set; } = [];
    
    [JsonPropertyName("posts")]
    public List<SearchResultItem> Posts { get; set; } = [];
    
    [JsonPropertyName("categories")]
    public List<SearchResultItem> Categories { get; set; } = [];
}

public sealed class SearchResultItem
{
    [JsonPropertyName("id")]
    public int Id { get; set; }
    
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;
    
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;
    
    [JsonPropertyName("subtitle")]
    public string Subtitle { get; set; } = string.Empty;
}
