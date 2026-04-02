using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;
using TijarahJo.Api.Common.Configuration;

namespace TijarahJo.Api.Common.Services;

public sealed record StoredPostImageFile(
    string PublicUrl,
    string FileName,
    long SizeBytes,
    string? ContentType
);

public interface IPostImageFileStorageService
{
    void ValidateFileOrThrow(IFormFile file);
    Task<StoredPostImageFile> SaveAsync(IFormFile file, CancellationToken cancellationToken = default);
    Task<StoredPostImageFile> SaveChatImageAsync(IFormFile file, CancellationToken cancellationToken = default);
    Task<StoredPostImageFile> SaveUserAvatarAsync(IFormFile file, CancellationToken cancellationToken = default);
    Task DeleteByPublicUrlAsync(string publicUrl, CancellationToken cancellationToken = default);
}

public sealed class LocalPostImageFileStorageService : IPostImageFileStorageService
{
    private static readonly StringComparison PathComparison =
        OperatingSystem.IsWindows() ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal;
    private static readonly string[] DefaultAllowedImageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

    private readonly IWebHostEnvironment _environment;
    private readonly FileStorageOptions _options;
    private readonly ILogger<LocalPostImageFileStorageService> _logger;
    private readonly HashSet<string> _allowedImageExtensions;

    public LocalPostImageFileStorageService(
        IWebHostEnvironment environment,
        IOptions<FileStorageOptions> options,
        ILogger<LocalPostImageFileStorageService> logger)
    {
        _environment = environment;
        _options = options.Value;
        _logger = logger;
        _allowedImageExtensions = BuildAllowedExtensions(_options.AllowedImageExtensions);
    }

    public async Task<StoredPostImageFile> SaveAsync(IFormFile file, CancellationToken cancellationToken = default)
    {
        ValidateFileOrThrow(file);

        return await SaveValidatedFile(
            file,
            ResolveAbsolutePostImagesRootPath(_environment.ContentRootPath, _options),
            fileName => BuildPublicPostImageUrl(fileName, _options),
            generateThumbnail: true,
            cancellationToken
        );
    }

    public async Task<StoredPostImageFile> SaveChatImageAsync(IFormFile file, CancellationToken cancellationToken = default)
    {
        ValidateFileOrThrow(file);

        return await SaveValidatedFile(
            file,
            ResolveAbsoluteChatImagesRootPath(_environment.ContentRootPath, _options),
            fileName => BuildPublicChatImagePath(fileName, _options),
            generateThumbnail: false,
            cancellationToken
        );
    }

    public async Task<StoredPostImageFile> SaveUserAvatarAsync(IFormFile file, CancellationToken cancellationToken = default)
    {
        ValidateFileOrThrow(file);

        return await SaveValidatedFile(
            file,
            ResolveAbsoluteUserAvatarsRootPath(_environment.ContentRootPath, _options),
            fileName => BuildPublicUserAvatarUrl(fileName, _options),
            generateThumbnail: false,
            cancellationToken
        );
    }

    public Task DeleteByPublicUrlAsync(string publicUrl, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(publicUrl))
        {
            return Task.CompletedTask;
        }

        string normalizedPublicBasePath = NormalizeRequestPath(_options.PublicBasePath);
        if (!publicUrl.StartsWith(normalizedPublicBasePath, StringComparison.OrdinalIgnoreCase))
        {
            return Task.CompletedTask;
        }

        string relativePath = publicUrl[normalizedPublicBasePath.Length..].TrimStart('/');
        if (string.IsNullOrWhiteSpace(relativePath))
        {
            return Task.CompletedTask;
        }

        string uploadsRoot = ResolveAbsoluteUploadsRootPath(_environment.ContentRootPath, _options);
        string targetPath = Path.GetFullPath(Path.Combine(uploadsRoot, relativePath));
        if (!IsUnderRoot(targetPath, uploadsRoot))
        {
            _logger.LogWarning("Skipped deleting post image outside uploads root: {Path}", targetPath);
            return Task.CompletedTask;
        }

        if (File.Exists(targetPath))
        {
            File.Delete(targetPath);
        }

        string thumbnailPath = BuildThumbnailAbsoluteFilePath(targetPath);
        if (File.Exists(thumbnailPath))
        {
            File.Delete(thumbnailPath);
        }

        return Task.CompletedTask;
    }

    public static bool TryResolveThumbnailPublicUrl(
        string publicUrl,
        string contentRootPath,
        FileStorageOptions options,
        out string thumbnailPublicUrl)
    {
        thumbnailPublicUrl = string.Empty;
        if (!TryResolveAbsoluteStoredFilePath(publicUrl, contentRootPath, options, out string absoluteFilePath))
        {
            return false;
        }

        string thumbnailAbsoluteFilePath = BuildThumbnailAbsoluteFilePath(absoluteFilePath);
        if (!File.Exists(thumbnailAbsoluteFilePath))
        {
            return false;
        }

        string uploadsRoot = ResolveAbsoluteUploadsRootPath(contentRootPath, options);
        string relativePath = Path.GetRelativePath(uploadsRoot, thumbnailAbsoluteFilePath)
            .Replace("\\", "/", StringComparison.Ordinal);
        thumbnailPublicUrl = $"{NormalizeRequestPath(options.PublicBasePath)}/{relativePath}";
        return true;
    }

    public static bool TryResolveAbsoluteStoredFilePath(
        string publicUrl,
        string contentRootPath,
        FileStorageOptions options,
        out string absoluteFilePath)
    {
        absoluteFilePath = string.Empty;

        if (string.IsNullOrWhiteSpace(publicUrl))
        {
            return false;
        }

        string candidatePath = publicUrl.Trim();
        if (Uri.TryCreate(candidatePath, UriKind.Absolute, out Uri? absoluteUri))
        {
            candidatePath = absoluteUri.AbsolutePath;
        }

        string normalizedPublicBasePath = NormalizeRequestPath(options.PublicBasePath);
        if (!candidatePath.StartsWith(normalizedPublicBasePath, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        string relativePath = candidatePath[normalizedPublicBasePath.Length..].TrimStart('/');
        if (string.IsNullOrWhiteSpace(relativePath))
        {
            return false;
        }

        string uploadsRoot = ResolveAbsoluteUploadsRootPath(contentRootPath, options);
        string targetPath = Path.GetFullPath(Path.Combine(uploadsRoot, relativePath));
        if (!IsUnderRoot(targetPath, uploadsRoot))
        {
            return false;
        }

        absoluteFilePath = targetPath;
        return true;
    }

    public static string ResolveAbsoluteUploadsRootPath(string contentRootPath, FileStorageOptions options)
    {
        string configuredRoot = string.IsNullOrWhiteSpace(options.RootPath)
            ? "uploads"
            : options.RootPath.Trim();

        string absoluteRoot = Path.IsPathRooted(configuredRoot)
            ? configuredRoot
            : Path.Combine(contentRootPath, configuredRoot);

        return Path.GetFullPath(absoluteRoot);
    }

    public static string ResolveAbsolutePostImagesRootPath(string contentRootPath, FileStorageOptions options)
    {
        string uploadsRoot = ResolveAbsoluteUploadsRootPath(contentRootPath, options);
        string postImagesSegment = NormalizePathSegment(options.PostImagesPath, "post-images");
        return Path.GetFullPath(Path.Combine(uploadsRoot, postImagesSegment));
    }

    public static string ResolveAbsoluteChatImagesRootPath(string contentRootPath, FileStorageOptions options)
    {
        string uploadsRoot = ResolveAbsoluteUploadsRootPath(contentRootPath, options);
        string chatImagesSegment = NormalizePathSegment(options.ChatImagesPath, "chat-images");
        return Path.GetFullPath(Path.Combine(uploadsRoot, chatImagesSegment));
    }

    public static string ResolveAbsoluteUserAvatarsRootPath(string contentRootPath, FileStorageOptions options)
    {
        string uploadsRoot = ResolveAbsoluteUploadsRootPath(contentRootPath, options);
        string userAvatarsSegment = NormalizePathSegment(options.UserAvatarsPath, "user-avatars");
        return Path.GetFullPath(Path.Combine(uploadsRoot, userAvatarsSegment));
    }

    public static string NormalizeRequestPath(string requestPath)
    {
        string normalized = string.IsNullOrWhiteSpace(requestPath)
            ? "/uploads"
            : requestPath.Trim();

        if (!normalized.StartsWith('/'))
        {
            normalized = "/" + normalized;
        }

        return normalized.TrimEnd('/');
    }

    public static string BuildPublicPostImageUrl(string fileName, FileStorageOptions options)
    {
        string basePath = NormalizeRequestPath(options.PublicBasePath);
        string postImagesSegment = NormalizePathSegment(options.PostImagesPath, "post-images");
        return $"{basePath}/{postImagesSegment}/{fileName}";
    }

    public static string BuildPublicChatImagePath(string fileName, FileStorageOptions options)
    {
        string basePath = NormalizeRequestPath(options.PublicBasePath);
        string chatImagesSegment = NormalizePathSegment(options.ChatImagesPath, "chat-images");
        return $"{basePath}/{chatImagesSegment}/{fileName}";
    }

    public static string BuildPublicUserAvatarUrl(string fileName, FileStorageOptions options)
    {
        string basePath = NormalizeRequestPath(options.PublicBasePath);
        string userAvatarsSegment = NormalizePathSegment(options.UserAvatarsPath, "user-avatars");
        return $"{basePath}/{userAvatarsSegment}/{fileName}";
    }

    public static string BuildThumbnailFileName(string fileName)
    {
        string extension = Path.GetExtension(fileName);
        string fileNameWithoutExtension = Path.GetFileNameWithoutExtension(fileName);
        return $"{fileNameWithoutExtension}.thumb{extension}";
    }

    public void ValidateFileOrThrow(IFormFile file)
    {
        if (file == null)
        {
            throw new ArgumentException("Image file is required.");
        }

        if (file.Length <= 0)
        {
            throw new ArgumentException("Image file is empty.");
        }

        if (file.Length > _options.MaxPostImageBytes)
        {
            throw new ArgumentException(
                $"Image file exceeds size limit of {_options.MaxPostImageBytes / (1024 * 1024)} MB."
            );
        }

        string extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(extension) || !_allowedImageExtensions.Contains(extension))
        {
            string allowed = string.Join(", ", _allowedImageExtensions.OrderBy(value => value, StringComparer.Ordinal));
            throw new ArgumentException($"Unsupported image extension. Allowed: {allowed}");
        }

        if (string.IsNullOrWhiteSpace(file.ContentType) ||
            !file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Unsupported image content type.");
        }
    }

    private async Task<StoredPostImageFile> SaveValidatedFile(
        IFormFile file,
        string absoluteDirectory,
        Func<string, string> publicUrlBuilder,
        bool generateThumbnail,
        CancellationToken cancellationToken)
    {
        if (ShouldOptimizeImage(file))
        {
            return await SaveOptimizedImageAsync(
                file,
                absoluteDirectory,
                publicUrlBuilder,
                generateThumbnail,
                cancellationToken);
        }

        string extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        string fileName = $"{DateTime.UtcNow:yyyyMMddHHmmssfff}_{Guid.NewGuid():N}{extension}";
        Directory.CreateDirectory(absoluteDirectory);

        string absoluteFilePath = Path.Combine(absoluteDirectory, fileName);
        await using (var stream = new FileStream(absoluteFilePath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        string publicUrl = publicUrlBuilder(fileName);
        _logger.LogInformation(
            "Stored image file {FileName} ({SizeBytes} bytes) at {Path}.",
            fileName,
            file.Length,
            absoluteFilePath
        );

        return new StoredPostImageFile(
            PublicUrl: publicUrl,
            FileName: fileName,
            SizeBytes: file.Length,
            ContentType: string.IsNullOrWhiteSpace(file.ContentType) ? null : file.ContentType
        );
    }

    private async Task<StoredPostImageFile> SaveOptimizedImageAsync(
        IFormFile file,
        string absoluteDirectory,
        Func<string, string> publicUrlBuilder,
        bool generateThumbnail,
        CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(absoluteDirectory);

        try
        {
            await using Stream inputStream = file.OpenReadStream();
            using Image image = await Image.LoadAsync(inputStream, cancellationToken);

            image.Mutate(context =>
            {
                context.AutoOrient();

                if (NeedsResize(image.Width, image.Height))
                {
                    context.Resize(new ResizeOptions
                    {
                        Mode = ResizeMode.Max,
                        Size = new Size(
                            Math.Max(1, _options.MaxImageWidth),
                            Math.Max(1, _options.MaxImageHeight)),
                    });
                }
            });

            StripMetadata(image);

            string optimizedExtension = ResolveOptimizedExtension(file.FileName);
            string fileName = $"{DateTime.UtcNow:yyyyMMddHHmmssfff}_{Guid.NewGuid():N}{optimizedExtension}";
            string absoluteFilePath = Path.Combine(absoluteDirectory, fileName);
            await using var optimizedBuffer = new MemoryStream();
            await image.SaveAsync(optimizedBuffer, CreateEncoder(optimizedExtension), cancellationToken);
            optimizedBuffer.Position = 0;

            await using (var outputStream = new FileStream(absoluteFilePath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
            {
                await optimizedBuffer.CopyToAsync(outputStream, cancellationToken);
            }

            if (generateThumbnail)
            {
                await SaveThumbnailAsync(image, absoluteDirectory, fileName, cancellationToken);
            }

            string publicUrl = publicUrlBuilder(fileName);
            long optimizedSize = optimizedBuffer.Length;
            string contentType = ResolveContentType(optimizedExtension);

            _logger.LogInformation(
                "Optimized image file {FileName} from {OriginalSizeBytes} bytes to {OptimizedSizeBytes} bytes at {Path}.",
                fileName,
                file.Length,
                optimizedSize,
                absoluteFilePath
            );

            return new StoredPostImageFile(
                PublicUrl: publicUrl,
                FileName: fileName,
                SizeBytes: optimizedSize,
                ContentType: contentType
            );
        }
        catch (UnknownImageFormatException ex)
        {
            throw new ArgumentException("Invalid image file.", ex);
        }
    }

    private bool ShouldOptimizeImage(IFormFile file)
    {
        if (!_options.OptimizeImages)
        {
            return false;
        }

        string extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        return extension is ".jpg" or ".jpeg" or ".png" or ".webp";
    }

    private bool NeedsResize(int width, int height)
        => width > Math.Max(1, _options.MaxImageWidth) || height > Math.Max(1, _options.MaxImageHeight);

    private string ResolveOptimizedExtension(string originalFileName)
    {
        string originalExtension = Path.GetExtension(originalFileName).ToLowerInvariant();
        if (_options.ConvertImagesToWebp && originalExtension != ".gif")
        {
            return ".webp";
        }

        return originalExtension;
    }

    private IImageEncoder CreateEncoder(string extension)
        => extension switch
        {
            ".webp" => new WebpEncoder
            {
                Quality = Math.Clamp(_options.WebpQuality, 1, 100),
            },
            _ => throw new InvalidOperationException($"No encoder configured for optimized image extension '{extension}'.")
        };

    private async Task SaveThumbnailAsync(
        Image image,
        string absoluteDirectory,
        string originalFileName,
        CancellationToken cancellationToken)
    {
        string thumbnailFileName = BuildThumbnailFileName(originalFileName);
        string thumbnailAbsolutePath = Path.Combine(absoluteDirectory, thumbnailFileName);
        using Image thumbnail = image.Clone(context => context.Resize(new ResizeOptions
        {
            Mode = ResizeMode.Max,
            Size = new Size(
                Math.Max(1, _options.ThumbnailMaxImageWidth),
                Math.Max(1, _options.ThumbnailMaxImageHeight)),
        }));

        StripMetadata(thumbnail);
        await using var outputStream = new FileStream(thumbnailAbsolutePath, FileMode.Create, FileAccess.Write, FileShare.None);
        await thumbnail.SaveAsync(outputStream, new WebpEncoder
        {
            Quality = Math.Clamp(_options.ThumbnailWebpQuality, 1, 100),
        }, cancellationToken);
    }

    private static string BuildThumbnailAbsoluteFilePath(string absoluteFilePath)
        => Path.Combine(
            Path.GetDirectoryName(absoluteFilePath) ?? string.Empty,
            BuildThumbnailFileName(Path.GetFileName(absoluteFilePath)));

    private static void StripMetadata(Image image)
    {
        image.Metadata.ExifProfile = null;
        image.Metadata.IccProfile = null;
        image.Metadata.XmpProfile = null;
    }

    private static string ResolveContentType(string extension)
        => extension switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".webp" => "image/webp",
            ".gif" => "image/gif",
            _ => "application/octet-stream",
        };

    private static string NormalizePathSegment(string value, string fallback)
    {
        string normalized = string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();
        normalized = normalized.Replace("\\", "/", StringComparison.Ordinal).Trim('/');
        return string.IsNullOrWhiteSpace(normalized) ? fallback : normalized;
    }

    private static bool IsUnderRoot(string path, string rootPath)
    {
        string normalizedRoot = rootPath.EndsWith(Path.DirectorySeparatorChar)
            ? rootPath
            : rootPath + Path.DirectorySeparatorChar;

        return path.StartsWith(normalizedRoot, PathComparison);
    }

    private static HashSet<string> BuildAllowedExtensions(IEnumerable<string>? configured)
    {
        var normalized = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (configured != null)
        {
            foreach (string raw in configured)
            {
                string value = raw?.Trim() ?? string.Empty;
                if (string.IsNullOrWhiteSpace(value))
                {
                    continue;
                }

                string withDot = value.StartsWith('.') ? value : "." + value;
                normalized.Add(withDot.ToLowerInvariant());
            }
        }

        if (normalized.Count == 0)
        {
            normalized.UnionWith(DefaultAllowedImageExtensions);
        }

        return normalized;
    }
}
