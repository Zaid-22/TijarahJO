namespace TijarahJo.Api.Common.Configuration;

public sealed class ImageModerationOptions
{
    /// <summary>
    /// When false, image uploads skip Google Cloud Vision Safe Search (no 503 if Vision is missing).
    /// </summary>
    public bool Enabled { get; set; } = true;
}
