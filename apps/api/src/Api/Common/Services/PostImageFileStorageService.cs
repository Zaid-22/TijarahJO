using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using TijarahJoDBAPI.Common.Configuration;

namespace TijarahJoDBAPI.Common.Services;

public sealed record StoredPostImageFile(
    string PublicUrl,
    string FileName,
    long SizeBytes,
    string? ContentType
);

public interface IPostImageFileStorageService
{
    Task<StoredPostImageFile> SaveAsync(IFormFile file, CancellationToken cancellationToken = default);
    Task DeleteByPublicUrlAsync(string publicUrl, CancellationToken cancellationToken = default);
}

public sealed class LocalPostImageFileStorageService : IPostImageFileStorageService
{
    private static readonly StringComparison PathComparison =
        OperatingSystem.IsWindows() ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal;

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
        ValidateFile(file);

        string extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        string fileName = $"{DateTime.UtcNow:yyyyMMddHHmmssfff}_{Guid.NewGuid():N}{extension}";
        string absoluteDirectory = ResolveAbsolutePostImagesRootPath(_environment.ContentRootPath, _options);
        Directory.CreateDirectory(absoluteDirectory);

        string absoluteFilePath = Path.Combine(absoluteDirectory, fileName);
        await using (var stream = new FileStream(absoluteFilePath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        string publicUrl = BuildPublicPostImageUrl(fileName, _options);
        _logger.LogInformation(
            "Stored post image file {FileName} ({SizeBytes} bytes) at {Path}.",
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

        return Task.CompletedTask;
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

    private void ValidateFile(IFormFile file)
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
    }

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
            normalized.UnionWith(new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" });
        }

        return normalized;
    }
}
