using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using System.Security.Cryptography;
using System.Text;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Api.Common.Configuration;
using TijarahJo.Api.Common.Services;
using TijarahJo.Api.Common.Utils;
using TijarahJo.Api.Contracts.Requests;
using TijarahJo.Api.Contracts.Responses;

namespace TijarahJo.Api.Features.Chat;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/chat")]
public class ChatController(
    IChatOrchestrationService chat,
    IMessageService messages,
    IChatRealtimeDeliveryService realtimeDelivery,
    IPostImageFileStorageService postImageStorage,
    IImageModerationService imageModeration,
    IWebHostEnvironment environment,
    IOptions<FileStorageOptions> fileStorageOptions,
    JwtOptions jwtOptions,
    ILogger<ChatController> logger) : ControllerBase
{
    private readonly IChatOrchestrationService _chat = chat;
    private readonly IMessageService _messages = messages;
    private readonly IChatRealtimeDeliveryService _realtimeDelivery = realtimeDelivery;
    private readonly IPostImageFileStorageService _postImageStorage = postImageStorage;
    private readonly IImageModerationService _imageModeration = imageModeration;
    private readonly IWebHostEnvironment _environment = environment;
    private readonly FileStorageOptions _fileStorageOptions = fileStorageOptions.Value;
    private readonly ILogger<ChatController> _logger = logger;
    private readonly byte[] _chatImageSigningKey = SHA256.HashData(Encoding.UTF8.GetBytes($"{jwtOptions.SigningKey}::chat-image-download"));
    private static readonly FileExtensionContentTypeProvider ContentTypeProvider = new();

    private string BuildChatImageDownloadUrl(string storedPath, int conversationId)
    {
        string encodedPath = Uri.EscapeDataString(storedPath);
        string signature = WebEncoders.Base64UrlEncode(ComputeChatImageSignature(storedPath, conversationId));
        return $"/api/v1/chat/download-image?conversationId={conversationId}&url={encodedPath}&sig={signature}";
    }

    private byte[] ComputeChatImageSignature(string storedPath, int conversationId)
    {
        using var hmac = new HMACSHA256(_chatImageSigningKey);
        return hmac.ComputeHash(Encoding.UTF8.GetBytes($"{conversationId}:{storedPath.Trim()}"));
    }

    private bool IsValidChatImageSignature(string storedPath, int conversationId, string? submittedSignature)
    {
        if (string.IsNullOrWhiteSpace(submittedSignature))
        {
            return false;
        }

        byte[] providedSignature;
        try
        {
            providedSignature = WebEncoders.Base64UrlDecode(submittedSignature.Trim());
        }
        catch (FormatException)
        {
            return false;
        }

        byte[] expectedSignature = ComputeChatImageSignature(storedPath, conversationId);
        return providedSignature.Length == expectedSignature.Length &&
               CryptographicOperations.FixedTimeEquals(providedSignature, expectedSignature);
    }

    [HttpGet("history/{otherUserId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IEnumerable<MessageResponseDTO>>> GetChatHistory(int otherUserId, CancellationToken cancellationToken)
    {
        if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int currentUserId, out ActionResult? failureResult))
        {
            return failureResult!;
        }

        ChatServiceResult<IReadOnlyList<ChatMessageEnvelope>> result =
            await _chat.GetHistoryAsync(currentUserId, otherUserId, cancellationToken);
        if (!result.Success || result.Value == null)
        {
            return this.ToChatProblem(result, "Chat operation failed.");
        }

        List<MessageResponseDTO> response = [.. result.Value
            .Select(item => DTOMapper.ToMessageResponseDTO(item.Message, item.ReceiverId, item.PostId))];
        return Ok(response);
    }

    [HttpGet("recent")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<MessageResponseDTO>>> GetRecentChats(CancellationToken cancellationToken)
    {
        if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int currentUserId, out ActionResult? failureResult))
        {
            return failureResult!;
        }

        ChatServiceResult<IReadOnlyList<ChatMessageEnvelope>> result = await _chat.GetRecentChatsAsync(currentUserId, cancellationToken);
        if (!result.Success || result.Value == null)
        {
            return this.ToChatProblem(result, "Chat operation failed.");
        }

        List<MessageResponseDTO> response = [.. result.Value
            .Select(item => DTOMapper.ToMessageResponseDTO(item.Message, item.ReceiverId, item.PostId))];
        return Ok(response);
    }

    [HttpGet("presence/{otherUserId:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PresenceResponseDTO>> GetPresence(int otherUserId, CancellationToken cancellationToken)
    {
        if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int currentUserId, out ActionResult? failureResult))
        {
            return failureResult!;
        }

        ChatServiceResult<ChatPresenceSnapshot> result = await _chat.GetPresenceAsync(currentUserId, otherUserId, cancellationToken);
        if (!result.Success || result.Value == null)
        {
            return this.ToChatProblem(result, "Chat operation failed.");
        }

        ChatPresenceSnapshot presence = result.Value;

        return Ok(new PresenceResponseDTO
        {
            UserId = presence.UserId,
            IsOnline = presence.IsOnline,
            LastSeenAtUtc = presence.LastSeenAtUtc,
            StatusText = presence.StatusText
        });
    }

    [HttpPost("send")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<MessageResponseDTO>> SendMessage([FromBody] SendChatMessageRequest request, CancellationToken cancellationToken)
    {
        if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int currentUserId, out ActionResult? failureResult))
        {
            return failureResult!;
        }

        ChatServiceResult<SendChatMessageOutcome> result = await _chat.SendMessageAsync(
            new SendChatMessageCommand
            {
                SenderUserId = currentUserId,
                ConversationId = request.ConversationId,
                ReceiverId = request.ReceiverId,
                PostId = request.PostId,
                Content = request.Content
            },
            cancellationToken
        );
        if (!result.Success || result.Value == null)
        {
            return this.ToChatProblem(result, "Chat operation failed.");
        }

        SendChatMessageOutcome outcome = result.Value;
        MessageResponseDTO dto = DTOMapper.ToMessageResponseDTO(outcome.Message.Message, outcome.ReceiverId, outcome.PostId);

        NotificationResponseDTO? notificationPayload = outcome.Notification is null
            ? null
            : DTOMapper.ToNotificationResponseDTO(outcome.Notification);

        await _realtimeDelivery.DeliverToReceiverAsync(
            outcome.ReceiverId,
            dto,
            notificationPayload,
            cancellationToken);

        return Ok(dto);
    }

    [HttpPost("upload-image")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ChatImageUploadResponseDTO>> UploadImage(
        [FromForm] UploadChatImageRequest request,
        CancellationToken cancellationToken)
    {
        if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int currentUserId, out ActionResult? failureResult))
        {
            return failureResult!;
        }

        if (request.File == null)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Image file is required.");
        }

        if (!request.ReceiverId.HasValue || request.ReceiverId.Value < 1 || request.ReceiverId.Value == currentUserId)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "A valid receiver is required.");
        }

        try
        {
            _postImageStorage.ValidateFileOrThrow(request.File);
        }
        catch (ArgumentException ex)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: ex.Message);
        }

        ModerationResult moderationResult = await _imageModeration.CheckImageAsync(request.File);
        if (moderationResult.IsUnavailable)
        {
            return Problem(
                statusCode: StatusCodes.Status503ServiceUnavailable,
                detail: moderationResult.FailureReason ?? "Image moderation service is unavailable."
            );
        }

        if (moderationResult.IsFlagged)
        {
            _logger.LogWarning(
                "User {UserId} attempted to upload a flagged chat image (Adult: {Adult}, Violence: {Violence}).",
                currentUserId,
                moderationResult.RawAdult,
                moderationResult.RawViolence);
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Image rejected by moderation filters (inappropriate content detected).");
        }

        int? conversationId = await _messages.GetOrCreateConversationIdAsync(
            currentUserId,
            request.ReceiverId.Value,
            request.PostId,
            cancellationToken);
        if (!conversationId.HasValue || conversationId.Value < 1)
        {
            return Problem(statusCode: StatusCodes.Status500InternalServerError, detail: "Failed to resolve conversation for image upload.");
        }

        StoredPostImageFile storedFile;
        try
        {
            storedFile = await _postImageStorage.SaveChatImageAsync(request.File, cancellationToken);
        }
        catch (ArgumentException ex)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: ex.Message);
        }

        return Ok(new ChatImageUploadResponseDTO
        {
            Url = BuildChatImageDownloadUrl(storedFile.PublicUrl, conversationId.Value)
        });
    }

    [HttpGet("download-image")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [AllowAnonymous]
    public IActionResult DownloadImage(
        [FromQuery] int conversationId,
        [FromQuery] string url,
        [FromQuery] string sig)
    {
        if (conversationId < 1 || string.IsNullOrWhiteSpace(url))
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Conversation ID and URL are required.");
        }

        try
        {
            if (Uri.TryCreate(url, UriKind.Absolute, out Uri? absoluteUri))
            {
                bool isHttpScheme =
                    absoluteUri.Scheme == Uri.UriSchemeHttp ||
                    absoluteUri.Scheme == Uri.UriSchemeHttps;
                if (!isHttpScheme ||
                    !absoluteUri.Host.Equals(Request.Host.Host, StringComparison.OrdinalIgnoreCase))
                {
                    return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Unsupported image URL.");
                }
            }

            string candidatePath = url.Trim();
            if (Uri.TryCreate(candidatePath, UriKind.Absolute, out Uri? candidateUri))
            {
                candidatePath = candidateUri.AbsolutePath;
            }

            string normalizedPublicBasePath = LocalPostImageFileStorageService.NormalizeRequestPath(_fileStorageOptions.PublicBasePath);
            string normalizedChatPrefix = $"{normalizedPublicBasePath}/{_fileStorageOptions.ChatImagesPath.Trim('/')}";
            if (!candidatePath.StartsWith(normalizedChatPrefix, StringComparison.OrdinalIgnoreCase))
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Unsupported image URL.");
            }

            if (!IsValidChatImageSignature(candidatePath, conversationId, sig))
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Invalid image signature.");
            }

            string uploadsRoot = LocalPostImageFileStorageService.ResolveAbsoluteUploadsRootPath(
                _environment.ContentRootPath,
                _fileStorageOptions);
            string relativePath = candidatePath[normalizedPublicBasePath.Length..].TrimStart('/');
            string absoluteFilePath = Path.GetFullPath(Path.Combine(uploadsRoot, relativePath));
            string chatRoot = LocalPostImageFileStorageService.ResolveAbsoluteChatImagesRootPath(
                _environment.ContentRootPath,
                _fileStorageOptions);
            string normalizedChatRoot = chatRoot.EndsWith(Path.DirectorySeparatorChar)
                ? chatRoot
                : chatRoot + Path.DirectorySeparatorChar;

            if (!absoluteFilePath.StartsWith(normalizedChatRoot, OperatingSystem.IsWindows() ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal))
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Unsupported image URL.");
            }

            if (!System.IO.File.Exists(absoluteFilePath))
            {
                return NotFound();
            }

            string fileName = Path.GetFileName(absoluteFilePath);
            if (string.IsNullOrWhiteSpace(fileName))
            {
                fileName = "chat-image.jpg";
            }

            if (!ContentTypeProvider.TryGetContentType(fileName, out string? contentType))
            {
                contentType = "application/octet-stream";
            }

            var stream = new FileStream(absoluteFilePath, FileMode.Open, FileAccess.Read, FileShare.Read, bufferSize: 4096, useAsync: true);
            return File(stream, contentType, fileName);
        }
        catch (Exception)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Failed to download image.");
        }
    }
}
