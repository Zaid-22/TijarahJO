using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Api.Tests;

/// <summary>
/// Contract-level tests for the FraudSignalsResult model and its supporting DTOs.
/// Validates that the fraud detection response contract is structurally sound
/// and correctly initializes default values.
/// </summary>
public sealed class FraudDetectionContractTests
{
    [Fact]
    public void FraudSignalsResult_DefaultValues_AreEmptyCollections()
    {
        var result = new FraudSignalsResult();

        Assert.NotNull(result.RapidRegistrationUsers);
        Assert.Empty(result.RapidRegistrationUsers);
        Assert.NotNull(result.DuplicateListingPosts);
        Assert.Empty(result.DuplicateListingPosts);
        Assert.NotNull(result.SuspiciousPricePosts);
        Assert.Empty(result.SuspiciousPricePosts);
        Assert.NotNull(result.ReviewBombingReviews);
        Assert.Empty(result.ReviewBombingReviews);
        Assert.NotNull(result.Signals);
        Assert.Empty(result.Signals);
    }

    [Fact]
    public void FraudSignalsResult_CanBePopulatedWithAllSignalTypes()
    {
        var result = new FraudSignalsResult
        {
            RapidRegistrations = true,
            RapidRegistrationCount = 12,
            DuplicateListings = 3,
            SuspiciousPriceCount = 5,
            ReviewBombingTargets = 2,
            CheckedAt = new DateTime(2025, 1, 1, 12, 0, 0, DateTimeKind.Utc),
            Signals =
            [
                new() { Type = "RAPID_REGISTRATION", Severity = "HIGH", Count = 12, Detail = "test" },
                new() { Type = "DUPLICATE_LISTINGS", Severity = "MEDIUM", Count = 3, Detail = "test" },
                new() { Type = "PRICE_ANOMALY", Severity = "LOW", Count = 5, Detail = "test" },
                new() { Type = "REVIEW_BOMBING", Severity = "HIGH", Count = 2, Detail = "test" }
            ]
        };

        Assert.True(result.RapidRegistrations);
        Assert.Equal(12, result.RapidRegistrationCount);
        Assert.Equal(4, result.Signals.Count);
        Assert.Equal("RAPID_REGISTRATION", result.Signals[0].Type);
        Assert.Equal("HIGH", result.Signals[0].Severity);
    }

    [Fact]
    public void FraudSignal_DefaultValues_AreEmptyStrings()
    {
        var signal = new FraudSignal();

        Assert.Equal(string.Empty, signal.Type);
        Assert.Equal(string.Empty, signal.Severity);
        Assert.Equal(0, signal.Count);
        Assert.Equal(string.Empty, signal.Detail);
    }

    [Fact]
    public void FraudUserCandidate_DefaultValues_AreCorrect()
    {
        var candidate = new FraudUserCandidate();

        Assert.Equal(0, candidate.UserID);
        Assert.Equal(string.Empty, candidate.Name);
        Assert.Equal(string.Empty, candidate.Email);
        Assert.Equal(0, candidate.Status);
    }

    [Fact]
    public void FraudPostCandidate_DefaultValues_AreCorrect()
    {
        var candidate = new FraudPostCandidate();

        Assert.Equal(0, candidate.PostID);
        Assert.Equal(0, candidate.UserID);
        Assert.Equal(string.Empty, candidate.Title);
        Assert.Equal(string.Empty, candidate.CategoryName);
        Assert.Equal(string.Empty, candidate.SellerName);
        Assert.Null(candidate.Price);
        Assert.Equal(string.Empty, candidate.SignalReason);
    }

    [Fact]
    public void FraudReviewCandidate_DefaultValues_AreCorrect()
    {
        var candidate = new FraudReviewCandidate();

        Assert.Equal(0, candidate.ReviewID);
        Assert.Equal(0, candidate.ReviewerID);
        Assert.Equal(string.Empty, candidate.ReviewerName);
        Assert.Equal(0, candidate.ReviewedUserID);
        Assert.Equal(string.Empty, candidate.ReviewedUserName);
        Assert.Equal(0, candidate.Rating);
        Assert.Null(candidate.Comment);
        Assert.Equal(string.Empty, candidate.SignalReason);
    }

    [Fact]
    public void FraudSignalsResult_SignalSeverity_IndicatesCorrectPriority()
    {
        var result = new FraudSignalsResult
        {
            RapidRegistrations = true,
            Signals =
            [
                new() { Type = "RAPID_REGISTRATION", Severity = "HIGH", Count = 20, Detail = "spike" },
                new() { Type = "DUPLICATE_LISTINGS", Severity = "LOW", Count = 0, Detail = "none" }
            ]
        };

        var highSeverity = result.Signals.Where(s => s.Severity == "HIGH").ToList();
        var lowSeverity = result.Signals.Where(s => s.Severity == "LOW").ToList();

        Assert.Single(highSeverity);
        Assert.Single(lowSeverity);
        Assert.Equal("RAPID_REGISTRATION", highSeverity[0].Type);
    }
}
