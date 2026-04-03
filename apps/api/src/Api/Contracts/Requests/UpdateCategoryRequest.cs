using System.ComponentModel.DataAnnotations;

namespace TijarahJo.Api.Contracts.Requests;

public sealed class UpdateCategoryRequest
{
    [Required]
    [MaxLength(100)]
    public string CategoryName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? NameAr { get; set; }

    [MaxLength(1000)]
    public string? Image { get; set; }
}
