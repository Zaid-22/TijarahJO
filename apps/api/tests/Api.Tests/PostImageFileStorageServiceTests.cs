using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Gif;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.PixelFormats;
using TijarahJo.Api.Common.Configuration;
using TijarahJo.Api.Common.Services;

namespace TijarahJo.Api.Tests;

public sealed class PostImageFileStorageServiceTests
{
    [Fact]
    public async Task SaveAsync_OptimizesLargeRasterImages_ToWebpAndResizes()
    {
        using var harness = new StorageHarness(new FileStorageOptions
        {
            RootPath = "uploads",
            PostImagesPath = "post-images",
            PublicBasePath = "/uploads",
            MaxPostImageBytes = 10 * 1024 * 1024,
            OptimizeImages = true,
            ConvertImagesToWebp = true,
            MaxImageWidth = 1200,
            MaxImageHeight = 1200,
            WebpQuality = 70,
        });

        byte[] originalBytes = CreateLargeJpegBytes(width: 2600, height: 1800);
        IFormFile upload = CreateFormFile(originalBytes, "listing.jpg", "image/jpeg");

        StoredPostImageFile stored = await harness.Service.SaveAsync(upload);

        Assert.EndsWith(".webp", stored.FileName, StringComparison.OrdinalIgnoreCase);
        Assert.Equal("image/webp", stored.ContentType);
        Assert.True(stored.SizeBytes > 0);
        Assert.True(stored.SizeBytes < originalBytes.Length);

        Assert.True(
            LocalPostImageFileStorageService.TryResolveAbsoluteStoredFilePath(
                stored.PublicUrl,
                harness.Environment.ContentRootPath,
                harness.Options,
                out string absolutePath));
        Assert.True(
            LocalPostImageFileStorageService.TryResolveThumbnailPublicUrl(
                stored.PublicUrl,
                harness.Environment.ContentRootPath,
                harness.Options,
                out string thumbnailPublicUrl));
        Assert.Contains(".thumb.", thumbnailPublicUrl, StringComparison.OrdinalIgnoreCase);
        Assert.True(
            LocalPostImageFileStorageService.TryResolveAbsoluteStoredFilePath(
                thumbnailPublicUrl,
                harness.Environment.ContentRootPath,
                harness.Options,
                out string thumbnailAbsolutePath));

        using Image optimizedImage = await Image.LoadAsync(absolutePath);
        using Image thumbnailImage = await Image.LoadAsync(thumbnailAbsolutePath);
        Assert.True(optimizedImage.Width <= harness.Options.MaxImageWidth);
        Assert.True(optimizedImage.Height <= harness.Options.MaxImageHeight);
        Assert.True(thumbnailImage.Width <= harness.Options.ThumbnailMaxImageWidth);
        Assert.True(thumbnailImage.Height <= harness.Options.ThumbnailMaxImageHeight);
        Assert.True(thumbnailImage.Width <= optimizedImage.Width);
        Assert.True(thumbnailImage.Height <= optimizedImage.Height);
    }

    [Fact]
    public async Task SaveAsync_KeepsGifUploadsInOriginalFormat()
    {
        using var harness = new StorageHarness(new FileStorageOptions
        {
            RootPath = "uploads",
            PostImagesPath = "post-images",
            PublicBasePath = "/uploads",
            MaxPostImageBytes = 10 * 1024 * 1024,
            OptimizeImages = true,
            ConvertImagesToWebp = true,
        });

        byte[] originalBytes = CreateGifBytes(width: 64, height: 64);
        IFormFile upload = CreateFormFile(originalBytes, "animated.gif", "image/gif");

        StoredPostImageFile stored = await harness.Service.SaveAsync(upload);

        Assert.EndsWith(".gif", stored.FileName, StringComparison.OrdinalIgnoreCase);
        Assert.Equal("image/gif", stored.ContentType);
        Assert.Equal(originalBytes.Length, stored.SizeBytes);
    }

    [Fact]
    public async Task PrivateUploads_AreStoredOutsideThePublicStaticRoot()
    {
        using var harness = new StorageHarness(new FileStorageOptions
        {
            RootPath = "uploads",
            PrivateRootPath = "private-uploads",
            ChatImagesPath = "chat-images",
            ReportImagesPath = "report-images",
            PublicBasePath = "/uploads",
            PrivateBasePath = "/private-uploads",
            MaxPostImageBytes = 10 * 1024 * 1024,
            OptimizeImages = true,
            ConvertImagesToWebp = true,
        });

        byte[] imageBytes = CreateLargeJpegBytes(width: 80, height: 80);
        StoredPostImageFile chatImage = await harness.Service.SaveChatImageAsync(
            CreateFormFile(imageBytes, "chat.jpg", "image/jpeg"));
        StoredPostImageFile reportImage = await harness.Service.SaveReportImageAsync(
            CreateFormFile(imageBytes, "report.jpg", "image/jpeg"));

        Assert.StartsWith("/private-uploads/chat-images/", chatImage.PublicUrl, StringComparison.Ordinal);
        Assert.StartsWith("/private-uploads/report-images/", reportImage.PublicUrl, StringComparison.Ordinal);
        Assert.True(LocalPostImageFileStorageService.TryResolveAbsolutePrivateStoredFilePath(
            chatImage.PublicUrl,
            harness.Environment.ContentRootPath,
            harness.Options,
            out string chatPath));
        Assert.True(LocalPostImageFileStorageService.TryResolveAbsolutePrivateStoredFilePath(
            reportImage.PublicUrl,
            harness.Environment.ContentRootPath,
            harness.Options,
            out string reportPath));
        Assert.True(File.Exists(chatPath));
        Assert.True(File.Exists(reportPath));
    }

    private static IFormFile CreateFormFile(byte[] bytes, string fileName, string contentType)
    {
        var stream = new MemoryStream(bytes);
        return new FormFile(stream, 0, bytes.Length, "file", fileName)
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType,
        };
    }

    private static byte[] CreateLargeJpegBytes(int width, int height)
    {
        using var image = new Image<Rgba32>(width, height);

        image.ProcessPixelRows(accessor =>
        {
            for (int y = 0; y < accessor.Height; y++)
            {
                Span<Rgba32> row = accessor.GetRowSpan(y);
                for (int x = 0; x < row.Length; x++)
                {
                    byte red = (byte)((x * 13 + y * 7) % 256);
                    byte green = (byte)((x * 5 + y * 11) % 256);
                    byte blue = (byte)((x * 3 + y * 17) % 256);
                    row[x] = new Rgba32(red, green, blue, 255);
                }
            }
        });

        using var stream = new MemoryStream();
        image.Save(stream, new JpegEncoder { Quality = 100 });
        return stream.ToArray();
    }

    private static byte[] CreateGifBytes(int width, int height)
    {
        using var image = new Image<Rgba32>(width, height, new Rgba32(255, 0, 0, 255));
        using var stream = new MemoryStream();
        image.Save(stream, new GifEncoder());
        return stream.ToArray();
    }

    private sealed class StorageHarness : IDisposable
    {
        private readonly string _tempRoot;

        public StorageHarness(FileStorageOptions options)
        {
            _tempRoot = Path.Combine(Path.GetTempPath(), $"tijarahjo-storage-tests-{Guid.NewGuid():N}");
            Directory.CreateDirectory(_tempRoot);

            Environment = new FakeWebHostEnvironment(_tempRoot);
            Options = options;
            Service = new LocalPostImageFileStorageService(
                Environment,
                Microsoft.Extensions.Options.Options.Create(Options),
                NullLogger<LocalPostImageFileStorageService>.Instance);
        }

        public FakeWebHostEnvironment Environment { get; }

        public FileStorageOptions Options { get; }

        public LocalPostImageFileStorageService Service { get; }

        public void Dispose()
        {
            if (Directory.Exists(_tempRoot))
            {
                Directory.Delete(_tempRoot, recursive: true);
            }
        }
    }

    private sealed class FakeWebHostEnvironment(string contentRootPath) : IWebHostEnvironment
    {
        public string ApplicationName { get; set; } = "TijarahJo.Api.Tests";
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
        public string WebRootPath { get; set; } = contentRootPath;
        public string EnvironmentName { get; set; } = "Development";
        public string ContentRootPath { get; set; } = contentRootPath;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
