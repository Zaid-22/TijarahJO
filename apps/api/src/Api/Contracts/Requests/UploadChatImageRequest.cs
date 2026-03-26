using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace TijarahJo.Api.Contracts.Requests;

public sealed class UploadChatImageRequest
{
    [Required]
    public IFormFile? File { get; set; }

    [Required]
    [Range(1, int.MaxValue)]
    public int? ReceiverId { get; set; }

    [Range(1, int.MaxValue)]
    public int? PostId { get; set; }
}
