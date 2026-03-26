using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Options;
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
public class ChatController : ControllerBase
{
    private readonly IChatOrchestrationService _chat;
    private readonly IChatRealtimeDeliveryService _realtimeDelivery;
    private readonly IPostImageFileStorageService _postImageStorage;
    private readonly IWebHostEnvironment _environment;
    private readonly FileStorageOptions _fileStorageOptions;
    private static readonly FileExtensionContentTypeProvider ContentTypeProvider = new();

    public ChatController(
        IChatOrchestrationService chat,
        IChatRealtimeDeliveryService realtimeDelivery,
        IPostImageFileStorageService postImageStorage,
        IWebHostEnvironment environment,
        IOptions<FileStorageOptions> fileStorageOptions)
    {
        _chat = chat;
        _realtimeDelivery = realtimeDelivery;
        _postImageStorage = postImageStorage;
        _environment = environment;
        _fileStorageOptions = fileStorageOptions.Value;
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

        List<MessageResponseDTO> response = result.Value
            .Select(item => DTOMapper.ToMessageResponseDTO(item.Message, item.ReceiverId, item.PostId))
            .ToList();
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

        List<MessageResponseDTO> response = result.Value
            .Select(item => DTOMapper.ToMessageResponseDTO(item.Message, item.ReceiverId, item.PostId))
            .ToList();
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
        if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int _, out ActionResult? failureResult))
        {
            return failureResult!;
        }

        if (request.File == null)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Image file is required.");
        }

        StoredPostImageFile storedFile;
        try
        {
            storedFile = await _postImageStorage.SaveAsync(request.File, cancellationToken);
        }
        catch (ArgumentException ex)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: ex.Message);
        }

        return Ok(new ChatImageUploadResponseDTO
        {
            Url = storedFile.PublicUrl
        });
    }

    [HttpGet("download-image")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadImage([FromQuery] string url, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "URL is required.");
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

            if (!LocalPostImageFileStorageService.TryResolveAbsoluteStoredFilePath(
                url,
                _environment.ContentRootPath,
                _fileStorageOptions,
                out string absoluteFilePath))
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

            byte[] fileBytes = await System.IO.File.ReadAllBytesAsync(absoluteFilePath, cancellationToken);
            return File(fileBytes, contentType, fileName);
        }
        catch (Exception)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Failed to download image.");
        }
    }
}
