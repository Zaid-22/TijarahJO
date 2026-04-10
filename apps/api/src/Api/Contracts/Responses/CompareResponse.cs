using System.Collections.Generic;

namespace TijarahJo.Api.Contracts.Responses;

public sealed class ComparePostDTO
{
    public int PostId { get; init; }
    public string Name { get; init; } = string.Empty;
    public decimal Price { get; init; }
    public string Category { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string? ImageUrl { get; init; }
    public string City { get; init; } = string.Empty;
    public long Views { get; init; }
}

public sealed class PostFeaturesDTO
{
    public string PostName { get; init; } = string.Empty;
    public List<string> Features { get; init; } = [];
}

public sealed class PostProsConsDTO
{
    public string PostName { get; init; } = string.Empty;
    public List<string> Pros { get; init; } = [];
    public List<string> Cons { get; init; } = [];
}

public sealed class PostSummaryDTO
{
    public string PostName { get; init; } = string.Empty;
    public string Summary { get; init; } = string.Empty;
}

public sealed class BestForDTO
{
    public string Budget { get; init; } = string.Empty;
    public string Performance { get; init; } = string.Empty;
    public string DailyUse { get; init; } = string.Empty;
}

public sealed class FinalRecommendationDTO
{
    public string WinnerName { get; init; } = string.Empty;
    public string BestFor { get; init; } = string.Empty;
    public string Reason { get; init; } = string.Empty;
}

public sealed class CompareResponse
{
    public List<ComparePostDTO> Posts { get; init; } = [];
    public string PriceComparison { get; init; } = string.Empty;
    public List<PostSummaryDTO> PostSummaries { get; init; } = [];
    public List<PostFeaturesDTO> FeatureDifferences { get; init; } = [];
    public List<PostProsConsDTO> ProsCons { get; init; } = [];
    public BestForDTO? BestFor { get; init; }
    public FinalRecommendationDTO? FinalRecommendation { get; init; }
}
