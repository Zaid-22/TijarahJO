using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace TijarahJoDBAPI.Contracts.Requests;

public sealed class UploadPostImageFileRequest
{
    [Range(1, int.MaxValue)]
    public int PostID { get; set; }

    [Required]
    public IFormFile? File { get; set; }
}
