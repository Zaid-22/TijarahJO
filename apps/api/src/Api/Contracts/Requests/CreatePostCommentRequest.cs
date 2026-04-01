using System.ComponentModel.DataAnnotations;

namespace TijarahJo.Api.Contracts.Requests;

public sealed class CreatePostCommentRequest
{
    [Required]
    [MaxLength(2000)]
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// Optional. Set to the ID of a top-level comment to create a reply.
    /// Leave null for a top-level comment.
    /// </summary>
    public int? ParentCommentId { get; set; }
}
