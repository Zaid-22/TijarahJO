using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using TijarahJo.Api.Common.Authorization;
using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Api.Features.Admin;

/// <summary>
/// Admin endpoint for fraud detection signals.
/// Provides rule-based auto-flagging indicators.
/// Results are cached for 5 minutes to avoid repeated heavy DB scans.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/fraud")]
[Authorize(Policy = AuthorizationPolicies.FraudView)]
public class AdminFraudDetectionController(
    IFraudDetectionService fraudDetectionService,
    IMemoryCache cache) : ControllerBase
{
    /// <summary>Cache TTL for fraud signals — these queries scan large tables.</summary>
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);
    private const string CacheKey = "admin:fraud:signals";

    /// <summary>
    /// Returns fraud detection signals based on rule-based checks.
    /// </summary>
    [HttpGet("signals")]
    public async Task<ActionResult> GetFraudSignals(CancellationToken cancellationToken)
    {
        if (cache.TryGetValue(CacheKey, out FraudSignalsResult? cached) && cached is not null)
        {
            return Ok(cached);
        }

        var result = await fraudDetectionService.GetFraudSignalsAsync(cancellationToken);

        cache.Set(CacheKey, result, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = CacheDuration
        });

        return Ok(result);
    }
}
