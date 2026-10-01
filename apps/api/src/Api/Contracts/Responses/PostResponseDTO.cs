using System.Text.Json.Serialization;

namespace TijarahJo.Api.Contracts.Responses;

public sealed class PostResponseDTO
{
    [JsonPropertyName("postId")]
    public int PostID { get; init; }

    [JsonPropertyName("categoryId")]
    public int CategoryID { get; init; }

    [JsonPropertyName("category")]
    public string Category { get; init; } = string.Empty;

    [JsonPropertyName("postTitle")]
    public string PostTitle { get; init; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; init; } = string.Empty;

    /// <summary>The post description (canonical field matching domain model PostDescription).</summary>
    [JsonPropertyName("postDescription")]
    public string PostDescription { get; init; } = string.Empty;

    [JsonPropertyName("price")]
    public decimal? Price { get; init; }

    [JsonPropertyName("status")]
    public int Status { get; init; }

    [JsonPropertyName("createdAt")]
    public System.DateTime CreatedAt { get; init; }

    [JsonPropertyName("isDeleted")]
    public bool IsDeleted { get; init; }

    [JsonPropertyName("views")]
    public long? Views { get; init; }

    [JsonPropertyName("cityId")]
    public int? CityId { get; init; }

    [JsonPropertyName("areaId")]
    public int? AreaId { get; init; }

    [JsonPropertyName("location")]
    public string Location { get; init; } = string.Empty;

    [JsonPropertyName("area")]
    public string? Area { get; init; }

    [JsonPropertyName("seller")]
    public string Seller { get; init; } = string.Empty;

    [JsonPropertyName("sellerId")]
    public string SellerId { get; init; } = string.Empty;
}

