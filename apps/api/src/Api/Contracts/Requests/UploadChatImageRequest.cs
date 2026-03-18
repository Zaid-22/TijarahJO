using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace TijarahJo.Api.Contracts.Requests;

public sealed class UploadChatImageRequest
{
    [Required]
    public IFormFile? File { get; set; }
}
