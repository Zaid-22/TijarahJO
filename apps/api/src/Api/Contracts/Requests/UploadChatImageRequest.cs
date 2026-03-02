using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace TijarahJoDBAPI.Contracts.Requests;

public sealed class UploadChatImageRequest
{
    [Required]
    public IFormFile? File { get; set; }
}
