using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Api.Common.Authorization;

namespace TijarahJo.Api.Features.Admin;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin")]
[Authorize(Policy = AuthorizationPolicies.AdminAccess)]
public class AdminDashboardController(
    IAdminQueryHandler adminQueries,
    IMemoryCache cache) : ControllerBase
{
    /// <summary>Cache TTL for dashboard stats — avoids redundant DB load on rapid admin refreshes.</summary>
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(2);
    private const string CacheKey = "admin:dashboard:stats";

    [HttpGet("stats")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<DashboardStatsResponse>> GetDashboardStats()
    {
        if (cache.TryGetValue(CacheKey, out object? cached) && cached is not null)
        {
            return Ok(cached);
        }

        var result = await adminQueries.GetDashboardStatsAsync(HttpContext.RequestAborted);
        if (!result.Success || result.Stats == null)
        {
            return Problem(
                statusCode: result.StatusCode,
                title: "ADMIN_STATS_FAILED",
                detail: result.Message
            );
        }

        cache.Set(CacheKey, result.Stats, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = CacheDuration
        });

        return Ok(result.Stats);
    }
}
