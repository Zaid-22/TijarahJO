using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;
using TijarahJo.Api.Common.Configuration;
using TijarahJo.Api.Common.Services;

namespace TijarahJo.Api.Startup;

internal static class UploadThumbnailFallbackExtensions
{
    internal static IApplicationBuilder UseUploadThumbnailFallback(
        this IApplicationBuilder app,
        string uploadsRootPath,
        string uploadsRequestPath)
    {
        string normalizedUploadsRoot = Path.GetFullPath(uploadsRootPath)
            .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar)
            + Path.DirectorySeparatorChar;

        return app.Use(async (context, next) =>
        {
            if (HttpMethods.IsGet(context.Request.Method) || HttpMethods.IsHead(context.Request.Method))
            {
                string? requestPath = context.Request.Path.Value;
                if (requestPath != null &&
                    requestPath.StartsWith(uploadsRequestPath, StringComparison.OrdinalIgnoreCase))
                {
                    string? originalRequestPath =
                        BundledUploadInitializer.ResolveOriginalUploadRequestPath(requestPath);

                    if (originalRequestPath != null &&
                        TryResolveExistingOriginalFile(
                            requestPath,
                            originalRequestPath,
                            uploadsRequestPath,
                            normalizedUploadsRoot,
                            out _))
                    {
                        context.Request.Path = originalRequestPath;
                    }
                }
            }

            await next();
        });
    }

    private static bool TryResolveExistingOriginalFile(
        string thumbRequestPath,
        string originalRequestPath,
        string uploadsRequestPath,
        string normalizedUploadsRoot,
        out string originalPhysicalPath)
    {
        originalPhysicalPath = string.Empty;

        string relativeThumbPath = thumbRequestPath[uploadsRequestPath.Length..].TrimStart('/');
        string relativeOriginalPath = originalRequestPath[uploadsRequestPath.Length..].TrimStart('/');
        if (string.IsNullOrWhiteSpace(relativeThumbPath) || string.IsNullOrWhiteSpace(relativeOriginalPath))
        {
            return false;
        }

        string thumbPhysicalPath = Path.GetFullPath(Path.Combine(normalizedUploadsRoot, relativeThumbPath));
        originalPhysicalPath = Path.GetFullPath(Path.Combine(normalizedUploadsRoot, relativeOriginalPath));

        return thumbPhysicalPath.StartsWith(normalizedUploadsRoot, StringComparison.Ordinal) &&
               originalPhysicalPath.StartsWith(normalizedUploadsRoot, StringComparison.Ordinal) &&
               !File.Exists(thumbPhysicalPath) &&
               File.Exists(originalPhysicalPath);
    }
}

internal static class BundledUploadInitializer
{
    private static readonly string[] ImageExtensions = [".jpg", ".jpeg", ".png", ".webp"];

    internal static void CopyBundledUploadDirectory(
        string contentRootPath,
        string uploadsRootPath,
        string relativeDirectory,
        ILogger logger)
    {
        string sourceRoot = Path.GetFullPath(Path.Combine(contentRootPath, "uploads", relativeDirectory));
        if (!Directory.Exists(sourceRoot))
        {
            return;
        }

        string targetRoot = Path.GetFullPath(Path.Combine(uploadsRootPath, relativeDirectory));
        string normalizedSourceRoot = sourceRoot.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        string normalizedTargetRoot = targetRoot.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        if (string.Equals(normalizedSourceRoot, normalizedTargetRoot, StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        Directory.CreateDirectory(targetRoot);

        int copiedCount = 0;
        foreach (string sourcePath in Directory.EnumerateFiles(sourceRoot, "*", SearchOption.TopDirectoryOnly))
        {
            string targetPath = Path.Combine(targetRoot, Path.GetFileName(sourcePath));
            if (File.Exists(targetPath) &&
                File.GetLastWriteTimeUtc(targetPath) >= File.GetLastWriteTimeUtc(sourcePath))
            {
                continue;
            }

            File.Copy(sourcePath, targetPath, overwrite: true);
            copiedCount++;
        }

        if (copiedCount > 0 && logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation(
                "Copied {CopiedCount} bundled upload assets from {SourceRoot} to {TargetRoot}.",
                copiedCount,
                sourceRoot,
                targetRoot);
        }
    }

    internal static async Task EnsureMissingThumbnailsAsync(
        string uploadsRootPath,
        FileStorageOptions options,
        ILogger logger,
        CancellationToken cancellationToken = default)
    {
        string[] thumbnailDirectories = ["post-images", "category-images"];
        int createdCount = 0;

        foreach (string relativeDirectory in thumbnailDirectories)
        {
            string directoryPath = Path.Combine(uploadsRootPath, relativeDirectory);
            if (!Directory.Exists(directoryPath))
            {
                continue;
            }

            foreach (string filePath in Directory.EnumerateFiles(directoryPath))
            {
                if (cancellationToken.IsCancellationRequested)
                {
                    return;
                }

                string extension = Path.GetExtension(filePath).ToLowerInvariant();
                if (!ImageExtensions.Contains(extension) ||
                    filePath.Contains(".thumb.", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                string thumbPath = Path.Combine(
                    directoryPath,
                    LocalPostImageFileStorageService.BuildThumbnailFileName(Path.GetFileName(filePath)));

                if (File.Exists(thumbPath))
                {
                    continue;
                }

                try
                {
                    await GenerateThumbnailAsync(filePath, thumbPath, options, cancellationToken);
                    createdCount++;
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Failed to generate thumbnail for bundled upload {Path}", filePath);
                }
            }
        }

        if (createdCount > 0 && logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation("Generated {CreatedCount} missing upload thumbnails.", createdCount);
        }
    }

    internal static string? ResolveOriginalUploadRequestPath(string requestPath)
    {
        const string thumbMarker = ".thumb.";
        int thumbIndex = requestPath.LastIndexOf(thumbMarker, StringComparison.OrdinalIgnoreCase);
        if (thumbIndex < 0)
        {
            return null;
        }

        int extensionIndex = requestPath.LastIndexOf('.');
        if (extensionIndex <= thumbIndex)
        {
            return null;
        }

        return requestPath[..thumbIndex] + requestPath[extensionIndex..];
    }

    private static async Task GenerateThumbnailAsync(
        string sourcePath,
        string thumbPath,
        FileStorageOptions options,
        CancellationToken cancellationToken)
    {
        using Image image = await Image.LoadAsync(sourcePath, cancellationToken);
        using Image thumbnail = image.Clone(context => context.Resize(new ResizeOptions
        {
            Mode = ResizeMode.Max,
            Size = new Size(
                Math.Max(1, options.ThumbnailMaxImageWidth),
                Math.Max(1, options.ThumbnailMaxImageHeight)),
        }));

        thumbnail.Metadata.ExifProfile = null;
        thumbnail.Metadata.IccProfile = null;
        thumbnail.Metadata.XmpProfile = null;

        string extension = Path.GetExtension(thumbPath).ToLowerInvariant();
        await using FileStream outputStream = new(thumbPath, FileMode.Create, FileAccess.Write, FileShare.None);

        if (extension is ".jpg" or ".jpeg")
        {
            await thumbnail.SaveAsync(outputStream, new JpegEncoder
            {
                Quality = Math.Clamp(options.ThumbnailWebpQuality, 1, 100),
            }, cancellationToken);
            return;
        }

        await thumbnail.SaveAsync(outputStream, new WebpEncoder
        {
            Quality = Math.Clamp(options.ThumbnailWebpQuality, 1, 100),
        }, cancellationToken);
    }
}
