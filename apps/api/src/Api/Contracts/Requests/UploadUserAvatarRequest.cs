using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace TijarahJo.Api.Contracts.Requests;

public sealed class UploadUserAvatarRequest
{
    [Required]
    public IFormFile File { get; set; } = default!;
}
