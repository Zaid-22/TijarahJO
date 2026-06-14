using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TijarahJo.Api.Common.Configuration;
using TijarahJo.Api.Common.Services;
using TijarahJo.Api.Contracts.Responses;
using TijarahJo.Api.Features.Chat;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Common;
using TijarahJo.Domain.Models;

namespace TijarahJo.Api.Tests;

public sealed class ChatControllerDownloadImageTests
{
    private const string SigningKey = "UnitTestSigningKey_AtLeast32Chars_Long";

    [Fact]
    public async Task DownloadImage_ReturnsUnauthorized_WhenUserClaimIsMissing()
    {
        using var harness = new DownloadImageHarness();
        ChatController controller = harness.CreateController(currentUserId: null, canAccessConversation: true);

        IActionResult result = await controller.DownloadImage(
            10,
            "/uploads/chat-images/sample.webp",
            "sig",
            CancellationToken.None);

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status401Unauthorized, objectResult.StatusCode);
    }

    [Fact]
    public async Task DownloadImage_ReturnsForbidden_WhenUserIsNotConversationParticipant()
    {
        using var harness = new DownloadImageHarness();
        ChatController controller = harness.CreateController(currentUserId: 5, canAccessConversation: false);

        IActionResult result = await controller.DownloadImage(
            10,
            "/uploads/chat-images/sample.webp",
            "sig",
            CancellationToken.None);

        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task DownloadImage_ReturnsBadRequest_WhenSignatureIsInvalid()
    {
        using var harness = new DownloadImageHarness();
        ChatController controller = harness.CreateController(currentUserId: 5, canAccessConversation: true);

        IActionResult result = await controller.DownloadImage(
            10,
            "/uploads/chat-images/sample.webp",
            "bad-signature",
            CancellationToken.None);

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status400BadRequest, objectResult.StatusCode);
    }

    [Fact]
    public async Task DownloadImage_ReturnsNotFound_WhenSignedFileIsMissing()
    {
        using var harness = new DownloadImageHarness();
        ChatController controller = harness.CreateController(currentUserId: 5, canAccessConversation: true);
        string imagePath = "/uploads/chat-images/missing.webp";

        IActionResult result = await controller.DownloadImage(
            10,
            imagePath,
            SignChatImagePath(imagePath, 10),
            CancellationToken.None);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task DownloadImage_ReturnsFile_WhenUserIsParticipantAndSignatureIsValid()
    {
        using var harness = new DownloadImageHarness();
        ChatController controller = harness.CreateController(currentUserId: 5, canAccessConversation: true);
        string imagePath = "/uploads/chat-images/sample.webp";
        harness.WriteChatImage("sample.webp", [1, 2, 3]);

        IActionResult result = await controller.DownloadImage(
            10,
            imagePath,
            SignChatImagePath(imagePath, 10),
            CancellationToken.None);

        var fileResult = Assert.IsType<FileStreamResult>(result);
        Assert.Equal("image/webp", fileResult.ContentType);
        await fileResult.FileStream.DisposeAsync();
    }

    private static string SignChatImagePath(string storedPath, int conversationId)
    {
        byte[] signingKey = SHA256.HashData(
            Encoding.UTF8.GetBytes($"{SigningKey}::chat-image-download"));
        using var hmac = new HMACSHA256(signingKey);
        byte[] signature = hmac.ComputeHash(
            Encoding.UTF8.GetBytes($"{conversationId}:{storedPath.Trim()}"));
        return WebEncoders.Base64UrlEncode(signature);
    }

    private sealed class DownloadImageHarness : IDisposable
    {
        private readonly string _root = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString("N"));
        private readonly FileStorageOptions _fileStorageOptions = new();

        public ChatController CreateController(int? currentUserId, bool canAccessConversation)
        {
            var httpContext = new DefaultHttpContext();
            httpContext.Request.Host = new HostString("localhost");
            if (currentUserId.HasValue)
            {
                httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(
                    [new Claim(ClaimTypes.NameIdentifier, currentUserId.Value.ToString())],
                    "UnitTest"));
            }

            return new ChatController(
                new FakeChatOrchestrationService(),
                new FakeMessageService(canAccessConversation),
                new NoopRealtimeDeliveryService(),
                new NoopPostImageStorageService(),
                new NoopImageModerationService(),
                new FakeWebHostEnvironment(_root),
                Options.Create(_fileStorageOptions),
                new JwtOptions { SigningKey = SigningKey },
                NullLogger<ChatController>.Instance)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = httpContext
                }
            };
        }

        public void WriteChatImage(string fileName, byte[] content)
        {
            string dir = Path.Combine(_root, "uploads", "chat-images");
            Directory.CreateDirectory(dir);
            File.WriteAllBytes(Path.Combine(dir, fileName), content);
        }

        public void Dispose()
        {
            if (Directory.Exists(_root))
            {
                Directory.Delete(_root, recursive: true);
            }
        }
    }

    private sealed class FakeMessageService(bool canAccessConversation) : IMessageService
    {
        public Task<bool> CanAccessConversationAsync(int userId, int conversationId, CancellationToken cancellationToken = default)
            => Task.FromResult(canAccessConversation);

        public Task<int?> GetOrCreateConversationIdAsync(int userA, int userB, int? postId = null, CancellationToken cancellationToken = default)
            => Task.FromResult<int?>(1);

        public Task<ConversationAccessMetadata?> GetConversationMetadataAsync(int conversationId, CancellationToken cancellationToken = default)
            => Task.FromResult<ConversationAccessMetadata?>(null);

        public Task<List<MessageModel>> GetChatHistoryAsync(int conversationId, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
            => Task.FromResult(new List<MessageModel>());

        public Task<List<MessageModel>> GetRecentChatsAsync(int userId, CancellationToken cancellationToken = default)
            => Task.FromResult(new List<MessageModel>());

        public Task<bool> MarkAsReadAsync(int conversationId, int receiverId, CancellationToken cancellationToken = default)
            => Task.FromResult(true);

        public Message Create(MessageModel model) => new(model);

        public Task<bool> SaveAsync(Message message, CancellationToken cancellationToken = default)
            => Task.FromResult(true);
    }

    private sealed class FakeChatOrchestrationService : IChatOrchestrationService
    {
        public Task<ChatServiceResult<IReadOnlyList<ChatMessageEnvelope>>> GetHistoryAsync(int currentUserId, int otherUserId, CancellationToken cancellationToken = default)
            => Task.FromResult(new ChatServiceResult<IReadOnlyList<ChatMessageEnvelope>> { Success = true, Value = [] });

        public Task<ChatServiceResult<IReadOnlyList<ChatMessageEnvelope>>> GetRecentChatsAsync(int currentUserId, CancellationToken cancellationToken = default)
            => Task.FromResult(new ChatServiceResult<IReadOnlyList<ChatMessageEnvelope>> { Success = true, Value = [] });

        public Task<ChatServiceResult<ChatPresenceSnapshot>> GetPresenceAsync(int currentUserId, int otherUserId, CancellationToken cancellationToken = default)
            => Task.FromResult(new ChatServiceResult<ChatPresenceSnapshot>
            {
                Success = true,
                Value = new ChatPresenceSnapshot { UserId = otherUserId, IsOnline = false }
            });

        public Task<ChatServiceResult<SendChatMessageOutcome>> SendMessageAsync(SendChatMessageCommand command, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();

        public Task<ChatServiceResult<SendChatMessageOutcome>> SendRealtimeMessageAsync(SendRealtimeChatMessageCommand command, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();
    }

    private sealed class NoopRealtimeDeliveryService : IChatRealtimeDeliveryService
    {
        public Task DeliverToReceiverAsync(int receiverUserId, MessageResponseDTO messagePayload, NotificationResponseDTO? notificationPayload, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task DeliverReadReceiptAsync(int senderUserId, int conversationId, int readerUserId, int lastReadMessageId, CancellationToken cancellationToken = default)
            => Task.CompletedTask;
    }

    private sealed class NoopPostImageStorageService : IPostImageFileStorageService
    {
        public void ValidateFileOrThrow(IFormFile file) { }
        public Task<StoredPostImageFile> SaveAsync(IFormFile file, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();
        public Task<StoredPostImageFile> SaveChatImageAsync(IFormFile file, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();
        public Task<StoredPostImageFile> SaveUserAvatarAsync(IFormFile file, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();
        public Task<StoredPostImageFile> SaveReportImageAsync(IFormFile file, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();
        public Task DeleteByPublicUrlAsync(string publicUrl, CancellationToken cancellationToken = default)
            => Task.CompletedTask;
    }

    private sealed class NoopImageModerationService : IImageModerationService
    {
        public Task<ModerationResult> CheckImageAsync(IFormFile file)
            => Task.FromResult(new ModerationResult());
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
