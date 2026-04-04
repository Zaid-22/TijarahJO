using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Asp.Versioning;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;
using TijarahJo.Api.Common.Authorization;
using TijarahJo.Api.Common.Configuration;
using TijarahJo.Api.Common.Services;
using TijarahJo.Infrastructure.Persistence;

namespace TijarahJo.Api.Features.Admin;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/images")]
[Authorize(Policy = AuthorizationPolicies.AdminOnly)]
public class AdminImageOptimizationController(
    IWebHostEnvironment environment,
    IOptions<FileStorageOptions> options,
    TijarahJoDbContext dbContext,
    ILogger<AdminImageOptimizationController> logger) : ControllerBase
{
    private readonly FileStorageOptions _options = options.Value;

    /// <summary>
    /// One-time migration: Re-optimizes existing uploaded images to WebP format,
    /// resizes oversized images, generates missing thumbnails,
    /// and updates database URLs only when the converted WebP file exists on disk.
    /// </summary>
    [HttpPost("optimize-existing")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> OptimizeExistingImages(CancellationToken cancellationToken)
    {
        var result = new OptimizationResult();

        string uploadsRoot = LocalPostImageFileStorageService.ResolveAbsoluteUploadsRootPath(
            environment.ContentRootPath, _options);

        if (!Directory.Exists(uploadsRoot))
        {
            return Ok(new { Message = "No uploads directory found.", result });
        }

        // Phase 1: Optimize files on disk
        string[] subDirs = ["post-images", "chat-images", "user-avatars"];
        foreach (string subDir in subDirs)
        {
            string dirPath = Path.Combine(uploadsRoot, subDir);
            if (!Directory.Exists(dirPath)) continue;

            bool generateThumbs = subDir == "post-images";
            await ProcessDirectory(dirPath, generateThumbs, result, cancellationToken);
        }

        // Phase 2: Update database URLs (.jpg/.png → .webp) only for converted upload assets.
        int dbUpdates = await UpdateDatabaseUrls(cancellationToken);
        result.DatabaseUrlsUpdated = dbUpdates;

        logger.LogInformation(
            "Image optimization complete: {Processed} processed, {Converted} converted to WebP, " +
            "{Resized} resized, {ThumbnailsCreated} thumbnails created, {Skipped} skipped, {Failed} failed, " +
            "{DbUpdated} database URLs updated. Saved {SavedKB:F0} KiB total.",
            result.Processed, result.ConvertedToWebp, result.Resized,
            result.ThumbnailsCreated, result.Skipped, result.Failed,
            result.DatabaseUrlsUpdated, result.BytesSaved / 1024.0);

        return Ok(new
        {
            Message = "Image optimization complete.",
            result.Processed,
            result.ConvertedToWebp,
            result.Resized,
            result.ThumbnailsCreated,
            result.Skipped,
            result.Failed,
            result.DatabaseUrlsUpdated,
            SavedKiB = Math.Round(result.BytesSaved / 1024.0, 1)
        });
    }

    private async Task<int> UpdateDatabaseUrls(CancellationToken ct)
    {
        int totalUpdated = 0;

        // Update CategoryEntity.Image
        var categories = await dbContext.Categories
            .Where(c => c.Image != null &&
                        (c.Image.EndsWith(".jpg") || c.Image.EndsWith(".jpeg") || c.Image.EndsWith(".png")))
            .ToListAsync(ct);

        foreach (var cat in categories)
        {
            if (!TryGetConvertedWebpUrl(cat.Image!, out string newUrl))
            {
                continue;
            }

            logger.LogInformation("Updating category {Id} image: {Old} → {New}", cat.CategoryID, cat.Image, newUrl);
            cat.Image = newUrl;
            totalUpdated++;
        }

        // Update PostImageEntity.PostImageURL
        var postImages = await dbContext.PostImages
            .Where(pi => pi.PostImageURL.EndsWith(".jpg") ||
                         pi.PostImageURL.EndsWith(".jpeg") ||
                         pi.PostImageURL.EndsWith(".png"))
            .ToListAsync(ct);

        foreach (var pi in postImages)
        {
            if (!TryGetConvertedWebpUrl(pi.PostImageURL, out string newUrl))
            {
                continue;
            }

            logger.LogInformation("Updating post image {Id}: {Old} → {New}", pi.PostImageID, pi.PostImageURL, newUrl);
            pi.PostImageURL = newUrl;
            totalUpdated++;
        }

        if (totalUpdated > 0)
        {
            await dbContext.SaveChangesAsync(ct);
        }

        return totalUpdated;
    }

    private static string ReplaceExtensionWithWebp(string url)
    {
        int lastDot = url.LastIndexOf('.');
        if (lastDot <= 0) return url;
        return url[..lastDot] + ".webp";
    }

    private bool TryGetConvertedWebpUrl(string currentUrl, out string convertedUrl)
    {
        convertedUrl = string.Empty;

        if (string.IsNullOrWhiteSpace(currentUrl))
        {
            return false;
        }

        string candidateUrl = ReplaceExtensionWithWebp(currentUrl);
        if (string.Equals(candidateUrl, currentUrl, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (!LocalPostImageFileStorageService.TryResolveAbsoluteStoredFilePath(
                candidateUrl,
                environment.ContentRootPath,
                _options,
                out string absoluteFilePath))
        {
            return false;
        }

        if (!System.IO.File.Exists(absoluteFilePath))
        {
            return false;
        }

        convertedUrl = candidateUrl;
        return true;
    }

    private async Task ProcessDirectory(
        string dirPath, bool generateThumbs,
        OptimizationResult result, CancellationToken ct)
    {
        string[] imageExtensions = [".jpg", ".jpeg", ".png", ".webp"];
        var files = Directory.EnumerateFiles(dirPath)
            .Where(f =>
            {
                string ext = Path.GetExtension(f).ToLowerInvariant();
                return imageExtensions.Contains(ext) && !f.Contains(".thumb.", StringComparison.Ordinal);
            })
            .ToList();

        foreach (string filePath in files)
        {
            if (ct.IsCancellationRequested) break;

            try
            {
                await ProcessSingleImage(filePath, generateThumbs, result, ct);
            }
            catch (Exception ex)
            {
                result.Failed++;
                logger.LogWarning(ex, "Failed to optimize image: {Path}", filePath);
            }
        }
    }

    private async Task ProcessSingleImage(
        string filePath, bool generateThumbs,
        OptimizationResult result, CancellationToken ct)
    {
        string ext = Path.GetExtension(filePath).ToLowerInvariant();
        bool isAlreadyWebp = ext == ".webp";
        long originalSize = new FileInfo(filePath).Length;

        using Image image = await Image.LoadAsync(filePath, ct);

        bool needsResize = image.Width > _options.MaxImageWidth || image.Height > _options.MaxImageHeight;
        bool needsConvert = _options.ConvertImagesToWebp && !isAlreadyWebp;

        string thumbPath = Path.Combine(
            Path.GetDirectoryName(filePath)!,
            LocalPostImageFileStorageService.BuildThumbnailFileName(Path.GetFileName(filePath)));

        if (!needsResize && !needsConvert)
        {
            if (generateThumbs && !System.IO.File.Exists(thumbPath))
            {
                await GenerateThumbnail(image, thumbPath, ct);
                result.ThumbnailsCreated++;
            }
            else
            {
                result.Skipped++;
                return;
            }

            result.Processed++;
            return;
        }

        image.Mutate(ctx =>
        {
            ctx.AutoOrient();
            if (needsResize)
            {
                ctx.Resize(new ResizeOptions
                {
                    Mode = ResizeMode.Max,
                    Size = new Size(
                        Math.Max(1, _options.MaxImageWidth),
                        Math.Max(1, _options.MaxImageHeight))
                });
            }
        });

        image.Metadata.ExifProfile = null;
        image.Metadata.IccProfile = null;
        image.Metadata.XmpProfile = null;

        if (needsConvert)
        {
            string newFileName = Path.GetFileNameWithoutExtension(filePath) + ".webp";
            string newFilePath = Path.Combine(Path.GetDirectoryName(filePath)!, newFileName);

            await using var buffer = new MemoryStream();
            await image.SaveAsync(buffer, new WebpEncoder
            {
                Quality = Math.Clamp(_options.WebpQuality, 1, 100)
            }, ct);

            buffer.Position = 0;
            await using (var outStream = new FileStream(newFilePath, FileMode.Create, FileAccess.Write, FileShare.None))
            {
                await buffer.CopyToAsync(outStream, ct);
            }

            long newSize = buffer.Length;
            result.BytesSaved += originalSize - newSize;
            result.ConvertedToWebp++;

            if (filePath != newFilePath && System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }

            if (generateThumbs)
            {
                string newThumbPath = Path.Combine(
                    Path.GetDirectoryName(newFilePath)!,
                    LocalPostImageFileStorageService.BuildThumbnailFileName(newFileName));
                await GenerateThumbnail(image, newThumbPath, ct);
                result.ThumbnailsCreated++;

                if (System.IO.File.Exists(thumbPath)) System.IO.File.Delete(thumbPath);
            }
        }
        else
        {
            await using var buffer = new MemoryStream();
            await image.SaveAsync(buffer, new WebpEncoder
            {
                Quality = Math.Clamp(_options.WebpQuality, 1, 100)
            }, ct);

            buffer.Position = 0;
            await using (var outStream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None))
            {
                await buffer.CopyToAsync(outStream, ct);
            }

            long newSize = buffer.Length;
            result.BytesSaved += originalSize - newSize;
        }

        if (needsResize) result.Resized++;

        if (generateThumbs)
        {
            string currentThumbPath = needsConvert
                ? Path.Combine(
                    Path.GetDirectoryName(filePath)!,
                    LocalPostImageFileStorageService.BuildThumbnailFileName(
                        Path.GetFileNameWithoutExtension(filePath) + ".webp"))
                : thumbPath;

            if (!System.IO.File.Exists(currentThumbPath))
            {
                await GenerateThumbnail(image, currentThumbPath, ct);
                result.ThumbnailsCreated++;
            }
        }

        result.Processed++;
    }

    private async Task GenerateThumbnail(Image sourceImage, string thumbPath, CancellationToken ct)
    {
        using Image thumbnail = sourceImage.Clone(ctx => ctx.Resize(new ResizeOptions
        {
            Mode = ResizeMode.Max,
            Size = new Size(
                Math.Max(1, _options.ThumbnailMaxImageWidth),
                Math.Max(1, _options.ThumbnailMaxImageHeight))
        }));

        thumbnail.Metadata.ExifProfile = null;
        thumbnail.Metadata.IccProfile = null;
        thumbnail.Metadata.XmpProfile = null;

        await using var outStream = new FileStream(thumbPath, FileMode.Create, FileAccess.Write, FileShare.None);
        await thumbnail.SaveAsync(outStream, new WebpEncoder
        {
            Quality = Math.Clamp(_options.ThumbnailWebpQuality, 1, 100)
        }, ct);
    }

    private sealed class OptimizationResult
    {
        public int Processed { get; set; }
        public int ConvertedToWebp { get; set; }
        public int Resized { get; set; }
        public int ThumbnailsCreated { get; set; }
        public int Skipped { get; set; }
        public int Failed { get; set; }
        public long BytesSaved { get; set; }
        public int DatabaseUrlsUpdated { get; set; }
    }
}
