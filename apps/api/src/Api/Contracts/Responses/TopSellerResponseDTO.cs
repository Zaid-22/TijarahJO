using System.Text.Json.Serialization;

namespace TijarahJo.Api.Contracts.Responses;

public sealed class TopSellerResponseDTO
{
    [JsonPropertyName("id")]
    public required string Id { get; init; }

    [JsonPropertyName("name")]
    public required string Name { get; init; }

    [JsonPropertyName("phone")]
    public required string Phone { get; init; }

    [JsonPropertyName("city")]
    public required string City { get; init; }

    [JsonPropertyName("area")]
    public required string Area { get; init; }

    [JsonPropertyName("avatar")]
    public required string Avatar { get; init; }

    [JsonPropertyName("joinedDate")]
    public required string JoinedDate { get; init; }

    [JsonPropertyName("activeListingsCount")]
    public required int ActiveListingsCount { get; init; }

    [JsonPropertyName("totalSalesCount")]
    public required int TotalSalesCount { get; init; }

    [JsonPropertyName("totalViews")]
    public required long TotalViews { get; init; }
}
