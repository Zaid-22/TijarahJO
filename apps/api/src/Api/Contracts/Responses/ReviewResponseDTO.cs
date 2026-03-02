namespace TijarahJoDBAPI.Contracts.Responses;

public class ReviewResponseDTO
{
    public int ReviewID { get; set; }
    public string Id { get; set; } = string.Empty;
    public int ReviewerID { get; set; }
    public int ReviewedUserID { get; set; }
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string? ReviewerName { get; set; }
    public string? ReviewerAvatar { get; set; }
}
