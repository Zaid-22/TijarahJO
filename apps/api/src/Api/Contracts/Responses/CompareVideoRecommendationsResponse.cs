using System.Collections.Generic;

namespace TijarahJo.Api.Contracts.Responses;

public sealed class CompareVideoRecommendationDTO
{
    public int PostId { get; init; }
    public string VideoId { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string ChannelTitle { get; init; } = string.Empty;
    public string ThumbnailUrl { get; init; } = string.Empty;
    public long ViewCount { get; init; }
    public string PublishedAt { get; init; } = string.Empty;
    public string SearchQuery { get; init; } = string.Empty;
}

public sealed class CompareVideoRecommendationsResponse
{
    public bool IsConfigured { get; init; }
    public string? Message { get; init; }
    public List<CompareVideoRecommendationDTO> Videos { get; init; } = [];
}
