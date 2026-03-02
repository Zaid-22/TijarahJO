namespace TijarahJoDBAPI.Contracts.Responses;

public class CategoryResponseDTO
{
    public int CategoryID { get; set; }
    public string Id { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? NameAr { get; set; }
    public string? Slug { get; set; }
    public string? Icon { get; set; }
    public string? Color { get; set; }
    public string? Image { get; set; }
    public System.DateTime CreatedAt { get; set; }
    public bool IsDeleted { get; set; }
}
