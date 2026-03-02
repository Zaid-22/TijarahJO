namespace TijarahJoDBAPI.Common.Configuration;

public sealed class FileStorageOptions
{
    // Relative paths are resolved from API content root.
    public string RootPath { get; set; } = "uploads";

    public string PostImagesPath { get; set; } = "post-images";

    // Public URL prefix used to serve files via static file middleware.
    public string PublicBasePath { get; set; } = "/uploads";

    public long MaxPostImageBytes { get; set; } = 5 * 1024 * 1024;

    public string[] AllowedImageExtensions { get; set; } =
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".gif"
    };
}
