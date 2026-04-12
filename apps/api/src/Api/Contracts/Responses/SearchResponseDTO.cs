using System.Text.Json.Serialization;

namespace TijarahJo.Api.Contracts.Responses;

public sealed class SearchResponseDTO
{
    [JsonPropertyName("success")]
    public required bool Success { get; init; }

    [JsonPropertyName("posts")]
    public required IReadOnlyList<SearchPostResponseDTO> Posts { get; init; }

    [JsonPropertyName("pagination")]
    public required SearchPaginationResponseDTO Pagination { get; init; }
}

public sealed class SearchPostResponseDTO
{
    [JsonPropertyName("id")]
    public required string Id { get; init; }

    [JsonPropertyName("name")]
    public required string Name { get; init; }

    [JsonPropertyName("price")]
    public required decimal Price { get; init; }

    [JsonPropertyName("location")]
    public required string Location { get; init; }

    [JsonPropertyName("locationAr")]
    public string LocationAr { get; init; } = string.Empty;

    [JsonPropertyName("area")]
    public string? Area { get; init; }

    [JsonPropertyName("areaAr")]
    public string? AreaAr { get; init; }

    [JsonPropertyName("seller")]
    public required string Seller { get; init; }

    [JsonPropertyName("sellerId")]
    public required string SellerId { get; init; }

    [JsonPropertyName("category")]
    public required string Category { get; init; }

    [JsonPropertyName("categoryId")]
    public required string CategoryId { get; init; }

    [JsonPropertyName("image")]
    public required string Image { get; set; }

    [JsonPropertyName("thumbnailImage")]
    public string ThumbnailImage { get; init; } = string.Empty;

    [JsonPropertyName("phone")]
    public required string Phone { get; init; }

    [JsonPropertyName("description")]
    public required string Description { get; init; }

    [JsonPropertyName("createdAt")]
    public required string CreatedAt { get; init; }

    [JsonPropertyName("updatedAt")]
    public required string UpdatedAt { get; init; }

    [JsonPropertyName("views")]
    public required long Views { get; init; }

    [JsonPropertyName("status")]
    public required string Status { get; init; }
}

public sealed class SearchPaginationResponseDTO
{
    [JsonPropertyName("currentPage")]
    public required int CurrentPage { get; init; }

    [JsonPropertyName("totalPages")]
    public required int TotalPages { get; init; }

    [JsonPropertyName("totalPosts")]
    public required int TotalPosts { get; init; }

    [JsonPropertyName("postsPerPage")]
    public required int PostsPerPage { get; init; }
}
