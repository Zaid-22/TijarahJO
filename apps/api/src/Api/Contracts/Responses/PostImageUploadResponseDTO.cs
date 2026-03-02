namespace TijarahJoDBAPI.Contracts.Responses;

public sealed class PostImageUploadResponseDTO
{
    public string Url { get; set; } = string.Empty;
    public PostImageResponseDTO PostImage { get; set; } = new();
}
