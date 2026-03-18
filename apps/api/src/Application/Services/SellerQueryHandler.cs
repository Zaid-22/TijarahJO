using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Application.Services;

public sealed class SellerQueryHandler : ISellerQueryHandler
{
    private readonly ISellerProfileService _sellerProfiles;

    public SellerQueryHandler(ISellerProfileService sellerProfiles)
    {
        _sellerProfiles = sellerProfiles;
    }

    public async Task<SellerProfileResult> GetProfileAsync(SellerProfileQuery query, CancellationToken cancellationToken = default)
    {
        string rawSellerId = query.SellerId?.Trim() ?? string.Empty;
        if (!int.TryParse(rawSellerId, out int sellerId) || sellerId < 1)
        {
            return new SellerProfileResult
            {
                Success = false,
                FailureReason = SellerProfileFailureReason.InvalidRequest,
                Message = $"Invalid seller ID: {query.SellerId}"
            };
        }

        return await _sellerProfiles.GetProfileAsync(sellerId, cancellationToken);
    }

    public Task<TopSellersResult> GetTopSellersAsync(int takeCount = 10, CancellationToken cancellationToken = default)
        => _sellerProfiles.GetTopSellersAsync(takeCount, cancellationToken);
}
