using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TijarahJo.Application.Abstractions.Services;

// ---------------------------------------------------------------------------
// AI Product Comparison Contracts
// ---------------------------------------------------------------------------

/// <summary>
/// Structured product data prepared for AI comparison.
/// </summary>
public sealed class ProductForComparison
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

/// <summary>
/// Comparison of features for a specific product.
/// </summary>
public sealed class ProductFeatures
{
    public string ProductName { get; init; } = string.Empty;
    public List<string> Features { get; init; } = [];
}

/// <summary>
/// Pros and cons for a single product in the comparison.
/// </summary>
public sealed class ProductProsCons
{
    public string ProductName { get; init; } = string.Empty;
    public List<string> Pros { get; init; } = [];
    public List<string> Cons { get; init; } = [];
}

/// <summary>
/// Best-for recommendation breakdown.
/// </summary>
public sealed class BestForRecommendation
{
    public string Budget { get; init; } = string.Empty;
    public string Performance { get; init; } = string.Empty;
    public string DailyUse { get; init; } = string.Empty;
}

public enum CompareFailureReason
{
    InvalidRequest,
    ProductNotFound,
    AiServiceError,
    RateLimited,
    InternalError
}

/// <summary>
/// Full result of an AI-powered product comparison.
/// </summary>
public sealed class ProductCompareResult
{
    public bool Success { get; init; }
    public CompareFailureReason? FailureReason { get; init; }
    public string? Message { get; init; }

    // Products that were compared
    public List<ProductForComparison> Products { get; init; } = [];

    // AI Analysis Sections
    public string PriceComparison { get; init; } = string.Empty;
    public List<ProductFeatures> FeatureDifferences { get; init; } = [];
    public List<ProductProsCons> ProsCons { get; init; } = [];
    public BestForRecommendation? BestFor { get; init; }
    public string FinalRecommendation { get; init; } = string.Empty;
}

/// <summary>
/// Service that compares 2–3 products using AI.
/// </summary>
public interface IProductCompareService
{
    Task<ProductCompareResult> CompareAsync(
        List<int> productIds,
        CancellationToken cancellationToken = default);
}
