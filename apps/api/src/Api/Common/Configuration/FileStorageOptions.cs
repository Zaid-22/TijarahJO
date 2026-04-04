namespace TijarahJo.Api.Common.Configuration;

public sealed class FileStorageOptions
{
    // Relative paths are resolved from API content root.
    public string RootPath { get; set; } = "uploads";

    public string PostImagesPath { get; set; } = "post-images";

    public string ChatImagesPath { get; set; } = "chat-images";

    public string UserAvatarsPath { get; set; } = "user-avatars";

    // Public URL prefix used to serve files via static file middleware.
    public string PublicBasePath { get; set; } = "/uploads";

    public long MaxPostImageBytes { get; set; } = 5 * 1024 * 1024;

    public bool OptimizeImages { get; set; } = true;

    public bool ConvertImagesToWebp { get; set; } = true;

    public int MaxImageWidth { get; set; } = 1280;

    public int MaxImageHeight { get; set; } = 1280;

    public int WebpQuality { get; set; } = 75;

    public int ThumbnailMaxImageWidth { get; set; } = 640;

    public int ThumbnailMaxImageHeight { get; set; } = 640;

    public int ThumbnailWebpQuality { get; set; } = 60;

    public string[] AllowedImageExtensions { get; set; } =
    [
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".gif"
    ];
}
