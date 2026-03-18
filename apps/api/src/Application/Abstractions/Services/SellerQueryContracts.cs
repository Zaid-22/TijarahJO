namespace TijarahJo.Application.Abstractions.Services;

public sealed class SellerProfileQuery
{
    public string? SellerId { get; init; }
}

public interface ISellerQueryHandler
{
    Task<SellerProfileResult> GetProfileAsync(SellerProfileQuery query, CancellationToken cancellationToken = default);

    Task<TopSellersResult> GetTopSellersAsync(int takeCount = 10, CancellationToken cancellationToken = default);
}
