namespace TijarahJoDBAPI.Contracts.Responses;

public class PostResponseDTO
{
    public int PostID { get; set; }
    public string Id { get; set; } = string.Empty;
    public int UserID { get; set; }
    public int CategoryID { get; set; }
    public string Category { get; set; } = string.Empty;
    public string PostTitle { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string PostDescription { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal? Price { get; set; }
    public int Status { get; set; }
    public System.DateTime CreatedAt { get; set; }
    public bool IsDeleted { get; set; }
    public long? Views { get; set; }
    public int? CityId { get; set; }
    public int? AreaId { get; set; }
    public string Location { get; set; } = string.Empty;
    public string? Area { get; set; }
    public string Seller { get; set; } = string.Empty;
    public string SellerId { get; set; } = string.Empty;
    public string[] Images { get; set; } = System.Array.Empty<string>();
}
