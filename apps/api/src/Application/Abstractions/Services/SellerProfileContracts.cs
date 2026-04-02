namespace TijarahJo.Application.Abstractions.Services;

public enum SellerProfileFailureReason
{
    InvalidRequest,
    NotFound,
    Unexpected
}

public sealed class SellerProfileReadModel
{
    public required SellerSummaryReadModel Seller { get; init; }
    public required IReadOnlyList<SellerPostReadModel> Posts { get; init; }
}

public sealed class SellerSummaryReadModel
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required string Phone { get; init; }
    public required string City { get; init; }
    public required string Area { get; init; }
    public required string Bio { get; init; }
    public required string Avatar { get; init; }
    public required string JoinedDate { get; init; }
    public required int ActiveListingsCount { get; init; }
    public required int TotalSalesCount { get; init; }
}

public sealed class SellerPostReadModel
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required decimal Price { get; init; }
    public required string Location { get; init; }
    public string? Area { get; init; }
    public required string Seller { get; init; }
    public required string SellerId { get; init; }
    public required string Category { get; init; }
    public required string CategoryId { get; init; }
    public required string Image { get; init; }
    public string ThumbnailImage { get; init; } = string.Empty;
    public required IReadOnlyList<string> Images { get; init; }
    public required string Phone { get; init; }
    public required string Description { get; init; }
    public required string CreatedAt { get; init; }
    public required string UpdatedAt { get; init; }
    public required long Views { get; init; }
    public required string Status { get; init; }
}

public sealed class SellerProfileResult
{
    public bool Success { get; init; }
    public SellerProfileReadModel? Profile { get; init; }
    public SellerProfileFailureReason? FailureReason { get; init; }
    public string? Message { get; init; }
}

public sealed class TopSellersResult
{
    public bool Success { get; init; }
    public IReadOnlyList<TopSellerReadModel> Sellers { get; init; } = Array.Empty<TopSellerReadModel>();
    public SellerProfileFailureReason? FailureReason { get; init; }
    public string? Message { get; init; }
}

public interface ISellerProfileService
{
    Task<SellerProfileResult> GetProfileAsync(int sellerId, CancellationToken cancellationToken = default);

    Task<TopSellersResult> GetTopSellersAsync(int takeCount = 10, CancellationToken cancellationToken = default);
}
