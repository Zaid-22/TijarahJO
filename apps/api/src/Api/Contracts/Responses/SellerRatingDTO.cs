namespace TijarahJo.Api.Contracts.Responses;

/// <summary>
/// Aggregated rating snapshot for a single seller, returned by the batch ratings endpoint.
/// </summary>
public class SellerRatingDTO
{
    public double AverageRating { get; set; }
    public int ReviewCount { get; set; }
}
