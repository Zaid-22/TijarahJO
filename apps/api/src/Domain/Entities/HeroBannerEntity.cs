using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TijarahJo.Domain.Entities;

[Table("HeroBanners")]
public sealed class HeroBannerEntity
{
    [Key]
    public int BannerID { get; set; }

    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(200)]
    public string TitleAr { get; set; } = string.Empty;

    [MaxLength(400)]
    public string Subtitle { get; set; } = string.Empty;

    [MaxLength(400)]
    public string SubtitleAr { get; set; } = string.Empty;

    [MaxLength(100)]
    public string ButtonText { get; set; } = string.Empty;

    [MaxLength(100)]
    public string ButtonTextAr { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(max)")]
    public string ImageUrl { get; set; } = string.Empty;

    [MaxLength(200)]
    public string BgClass { get; set; } = string.Empty;

    [MaxLength(200)]
    public string TextClass { get; set; } = string.Empty;

    [MaxLength(200)]
    public string AltText { get; set; } = string.Empty;

    [MaxLength(200)]
    public string AltTextAr { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? LinkUrl { get; set; }

    public bool IsActive { get; set; } = true;

    public int DisplayOrder { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
