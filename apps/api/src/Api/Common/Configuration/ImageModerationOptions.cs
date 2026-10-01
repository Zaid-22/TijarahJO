using Google.Cloud.Vision.V1;

namespace TijarahJo.Api.Common.Configuration;

public sealed class ImageModerationOptions
{
    /// <summary>
    /// When false, image uploads skip Google Cloud Vision Safe Search (no 503 if Vision is missing).
    /// </summary>
    public bool Enabled { get; set; } = false;

    /// <summary>
    /// Minimum Vision likelihood to treat an image as adult content and block it.
    /// Valid values: VeryUnlikely, Unlikely, Possible, Likely, VeryLikely.
    /// Default: Likely — blocks most harmful content without over-triggering on product photos.
    /// </summary>
    public Likelihood AdultThreshold { get; set; } = Likelihood.Likely;

    /// <summary>
    /// Minimum Vision likelihood to treat an image as violent and block it.
    /// </summary>
    public Likelihood ViolenceThreshold { get; set; } = Likelihood.Likely;

    /// <summary>
    /// Minimum Vision likelihood to treat an image as racy/suggestive and block it.
    /// Default: VeryLikely — racy is intentionally stricter to avoid false positives on
    /// legitimate clothing, fitness or beauty product photos.
    /// </summary>
    public Likelihood RacyThreshold { get; set; } = Likelihood.VeryLikely;
}
