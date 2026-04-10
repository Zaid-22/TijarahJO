using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TijarahJo.Application.Abstractions.Services;

// ---------------------------------------------------------------------------
// AI Product Comparison Contracts
// ---------------------------------------------------------------------------

/// <summary>
/// Structured post data prepared for AI comparison.
/// </summary>
public sealed class PostForComparison
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

/// <summary>
/// Comparison of features for a specific post.
/// </summary>
public sealed class PostFeatures
{
    public string PostName { get; init; } = string.Empty;
    public List<string> Features { get; init; } = [];
}

/// <summary>
/// Pros and cons for a single post in the comparison.
/// </summary>
public sealed class PostProsCons
{
    public string PostName { get; init; } = string.Empty;
    public List<string> Pros { get; init; } = [];
    public List<string> Cons { get; init; } = [];
}

/// <summary>
/// AI-generated summary for a single post.
/// </summary>
public sealed class PostSummary
{
    public string PostName { get; init; } = string.Empty;
    public string Summary { get; init; } = string.Empty;
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

/// <summary>
/// Structured final recommendation from AI.
/// </summary>
public sealed class FinalRecommendationResult
{
    public string WinnerName { get; init; } = string.Empty;
    public string BestFor { get; init; } = string.Empty;
    public string Reason { get; init; } = string.Empty;
}

public enum CompareFailureReason
{
    InvalidRequest,
    PostNotFound,
    AiServiceError,
    RateLimited,
    InternalError
}

/// <summary>
/// Full result of an AI-powered post comparison.
/// </summary>
public sealed class PostCompareResult
{
    public bool Success { get; init; }
    public CompareFailureReason? FailureReason { get; init; }
    public string? Message { get; init; }

    // Posts that were compared
    public List<PostForComparison> Posts { get; init; } = [];

    // AI Analysis Sections
    public string PriceComparison { get; init; } = string.Empty;
    public List<PostSummary> PostSummaries { get; init; } = [];
    public List<PostFeatures> FeatureDifferences { get; init; } = [];
    public List<PostProsCons> ProsCons { get; init; } = [];
    public BestForRecommendation? BestFor { get; init; }
    public FinalRecommendationResult? FinalRecommendation { get; init; }
}

/// <summary>
/// Service that compares 2–3 posts using AI.
/// </summary>
public interface IPostCompareService
{
    Task<PostCompareResult> CompareAsync(
        List<int> postIds,
        string language = "en",
        CancellationToken cancellationToken = default);
}
