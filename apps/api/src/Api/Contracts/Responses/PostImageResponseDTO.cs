namespace TijarahJo.Api.Contracts.Responses;

public class PostImageResponseDTO
{
    public int PostImageID { get; set; }
    public string Id { get; set; } = string.Empty;
    public int PostID { get; set; }
    public string PostImageURL { get; set; } = string.Empty;
    public string ThumbnailPostImageURL { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }
    public bool IsDeleted { get; set; }
}
