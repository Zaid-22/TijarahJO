using System;

namespace TijarahJo.Domain.Entities;

/// <summary>
/// Represents a homepage hero carousel banner.
/// Configured via Fluent API in HeroBannerConfiguration.
/// </summary>
public sealed class HeroBannerEntity
{
    public int BannerID { get; set; }
    public string Title { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
    public string SubtitleAr { get; set; } = string.Empty;
    public string ButtonText { get; set; } = string.Empty;
    public string ButtonTextAr { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string BgClass { get; set; } = string.Empty;
    public string TextClass { get; set; } = string.Empty;
    public string AltText { get; set; } = string.Empty;
    public string AltTextAr { get; set; } = string.Empty;
    public string? LinkUrl { get; set; }
    public bool IsActive { get; set; }
    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
