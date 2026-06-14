using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace TijarahJo.Api.Contracts.Requests;

public sealed class CreateReportRequest
{
    [Required]
    [MaxLength(20)]
    public string ReportType { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int TargetID { get; set; }

    [Required]
    [MaxLength(50)]
    public string Reason { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    /// <summary>Optional evidence image (screenshot, photo, etc.).</summary>
    public IFormFile? Image { get; set; }
}
