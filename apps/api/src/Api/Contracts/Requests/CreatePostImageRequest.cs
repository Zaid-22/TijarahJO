using System;
using System.ComponentModel.DataAnnotations;

namespace TijarahJo.Api.Contracts.Requests;

public sealed class CreatePostImageRequest
{
    [Range(1, int.MaxValue)]
    public int PostID { get; set; }

    [Required]
    [MaxLength(4000)]
    public string PostImageURL { get; set; } = string.Empty;

    public DateTime? UploadedAt { get; set; }
}
