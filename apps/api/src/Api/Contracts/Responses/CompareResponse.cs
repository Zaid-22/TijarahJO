using System.Collections.Generic;

namespace TijarahJo.Api.Contracts.Responses;

public sealed class CompareProductDTO
{
    public int ProductId { get; init; }
    public string Name { get; init; } = string.Empty;
    public decimal Price { get; init; }
    public string Category { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string? ImageUrl { get; init; }
    public string City { get; init; } = string.Empty;
    public long Views { get; init; }
}

public sealed class ProductFeaturesDTO
{
    public string ProductName { get; init; } = string.Empty;
    public List<string> Features { get; init; } = [];
}

public sealed class ProductProsConsDTO
{
    public string ProductName { get; init; } = string.Empty;
    public List<string> Pros { get; init; } = [];
    public List<string> Cons { get; init; } = [];
}

public sealed class BestForDTO
{
    public string Budget { get; init; } = string.Empty;
    public string Performance { get; init; } = string.Empty;
    public string DailyUse { get; init; } = string.Empty;
}

public sealed class CompareResponse
{
    public List<CompareProductDTO> Products { get; init; } = [];
    public string PriceComparison { get; init; } = string.Empty;
    public List<ProductFeaturesDTO> FeatureDifferences { get; init; } = [];
    public List<ProductProsConsDTO> ProsCons { get; init; } = [];
    public BestForDTO? BestFor { get; init; }
    public string FinalRecommendation { get; init; } = string.Empty;
}
