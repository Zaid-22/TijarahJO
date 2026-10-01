using System.ComponentModel.DataAnnotations;

namespace TijarahJo.Api.Contracts.Requests;

public sealed class UpdatePostCommentRequest
{
    [Required]
    [MaxLength(1000)]
    public string Content { get; set; } = string.Empty;
}
