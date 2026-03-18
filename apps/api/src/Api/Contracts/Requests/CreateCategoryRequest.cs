using System.ComponentModel.DataAnnotations;

namespace TijarahJo.Api.Contracts.Requests;

public sealed class CreateCategoryRequest
{
    [Required]
    [MaxLength(100)]
    public string CategoryName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? NameAr { get; set; }

    [MaxLength(100)]
    public string? Icon { get; set; }

    [MaxLength(20)]
    public string? Color { get; set; }

    [MaxLength(1000)]
    public string? Image { get; set; }
}
