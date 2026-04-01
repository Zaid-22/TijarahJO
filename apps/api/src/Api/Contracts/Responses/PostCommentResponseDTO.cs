namespace TijarahJo.Api.Contracts.Responses;

public class PostCommentResponseDTO
{
    public int CommentID { get; set; }
    public string Id { get; set; } = string.Empty;
    public int PostID { get; set; }
    public int UserID { get; set; }
    public int? ParentCommentID { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? AuthorName { get; set; }
    public string? AuthorAvatar { get; set; }
    public int ReplyCount { get; set; }
    public bool IsEdited { get; set; }
}

public class PostCommentListResponseDTO
{
    public IReadOnlyList<PostCommentResponseDTO> Comments { get; set; } = [];
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
