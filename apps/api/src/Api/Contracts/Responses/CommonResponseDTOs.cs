using System.Text.Json.Serialization;

namespace TijarahJo.Api.Contracts.Responses;

public sealed class ApiMessageResponse
{
    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;
}

public sealed class OperationSuccessResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }
}

public sealed class FavoritesResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }
    [JsonPropertyName("favorites")]
    public List<string> Favorites { get; set; } = new();
}

public sealed class PresenceResponseDTO
{
    [JsonPropertyName("userId")]
    public int UserId { get; set; }
    [JsonPropertyName("isOnline")]
    public bool IsOnline { get; set; }
    [JsonPropertyName("lastSeenAtUtc")]
    public DateTime? LastSeenAtUtc { get; set; }
    [JsonPropertyName("statusText")]
    public string StatusText { get; set; } = string.Empty;
}

public sealed class CityResponseDTO
{
    public int CityId { get; set; }
    public string CityName { get; set; } = string.Empty;
    public string CityNameAr { get; set; } = string.Empty;
}

public sealed class AreaResponseDTO
{
    public int AreaId { get; set; }
    public string AreaName { get; set; } = string.Empty;
    public string AreaNameAr { get; set; } = string.Empty;
    public int CityId { get; set; }
}

public sealed class PostViewIncrementResponse
{
    public string Message { get; set; } = string.Empty;
    public int PostId { get; set; }
}

public sealed class SellerProfileResponseDTO
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }
    [JsonPropertyName("seller")]
    public SellerSummaryResponseDTO Seller { get; set; } = new();
    [JsonPropertyName("posts")]
    public List<SellerPostResponseDTO> Posts { get; set; } = new();
}

public sealed class SellerSummaryResponseDTO
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
    [JsonPropertyName("phone")]
    public string Phone { get; set; } = string.Empty;
    [JsonPropertyName("city")]
    public string City { get; set; } = string.Empty;
    [JsonPropertyName("area")]
    public string Area { get; set; } = string.Empty;
    [JsonPropertyName("bio")]
    public string Bio { get; set; } = string.Empty;
    [JsonPropertyName("avatar")]
    public string Avatar { get; set; } = string.Empty;
    [JsonPropertyName("joinedDate")]
    public string JoinedDate { get; set; } = string.Empty;
    [JsonPropertyName("activeListingsCount")]
    public int ActiveListingsCount { get; set; }
    [JsonPropertyName("totalSalesCount")]
    public int TotalSalesCount { get; set; }
}

public sealed class SellerPostResponseDTO
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
    [JsonPropertyName("price")]
    public decimal Price { get; set; }
    [JsonPropertyName("location")]
    public string Location { get; set; } = string.Empty;
    [JsonPropertyName("area")]
    public string? Area { get; set; }
    [JsonPropertyName("seller")]
    public string Seller { get; set; } = string.Empty;
    [JsonPropertyName("sellerId")]
    public string SellerId { get; set; } = string.Empty;
    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;
    [JsonPropertyName("categoryId")]
    public string CategoryId { get; set; } = string.Empty;
    [JsonPropertyName("image")]
    public string Image { get; set; } = string.Empty;
    [JsonPropertyName("thumbnailImage")]
    public string ThumbnailImage { get; set; } = string.Empty;
    [JsonPropertyName("images")]
    public List<string> Images { get; set; } = new();
    [JsonPropertyName("phone")]
    public string Phone { get; set; } = string.Empty;
    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;
    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = string.Empty;
    [JsonPropertyName("updatedAt")]
    public string UpdatedAt { get; set; } = string.Empty;
    [JsonPropertyName("views")]
    public long Views { get; set; }
    [JsonPropertyName("status")]
    public string Status { get; set; } = "ACTIVE";
}
