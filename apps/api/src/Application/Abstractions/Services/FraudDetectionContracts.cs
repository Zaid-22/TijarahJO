namespace TijarahJo.Application.Abstractions.Services;

/// <summary>
/// Fraud detection result types.
/// </summary>
public sealed class FraudSignalsResult
{
    public bool RapidRegistrations { get; set; }
    public int RapidRegistrationCount { get; set; }
    public int DuplicateListings { get; set; }
    public int SuspiciousPriceCount { get; set; }
    public int ReviewBombingTargets { get; set; }
    public DateTime CheckedAt { get; set; }
    public List<FraudUserCandidate> RapidRegistrationUsers { get; set; } = [];
    public List<FraudPostCandidate> DuplicateListingPosts { get; set; } = [];
    public List<FraudPostCandidate> SuspiciousPricePosts { get; set; } = [];
    public List<FraudReviewCandidate> ReviewBombingReviews { get; set; } = [];
    public List<FraudSignal> Signals { get; set; } = [];
}

public sealed class FraudSignal
{
    public string Type { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public int Count { get; set; }
    public string Detail { get; set; } = string.Empty;
}

public sealed class FraudUserCandidate
{
    public int UserID { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; }
    public int Status { get; set; }
}

public sealed class FraudPostCandidate
{
    public int PostID { get; set; }
    public int UserID { get; set; }
    public string Title { get; set; } = string.Empty;
    public int CategoryID { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string SellerName { get; set; } = string.Empty;
    public decimal? Price { get; set; }
    public int Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public string SignalReason { get; set; } = string.Empty;
}

public sealed class FraudReviewCandidate
{
    public int ReviewID { get; set; }
    public int ReviewerID { get; set; }
    public string ReviewerName { get; set; } = string.Empty;
    public int ReviewedUserID { get; set; }
    public string ReviewedUserName { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
    public string SignalReason { get; set; } = string.Empty;
}

public interface IFraudDetectionService
{
    Task<FraudSignalsResult> GetFraudSignalsAsync(CancellationToken cancellationToken = default);
}
