using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using TijarahJoDB.DAL.Entities;
using TijarahJoDBAPI.Common.Configuration;
using TijarahJoDBAPI.Common.Services;
using TijarahJoDBAPI.Common.Utils;
using TijarahJoDBAPI.Contracts.Requests;
using TijarahJoDBAPI.Contracts.Responses;

namespace TijarahJoDBAPI.Features.Notifications;

[Authorize]
[ApiController]
[Route("api/notifications")]
[Route("api/v1/notifications")]
public sealed class NotificationsController : ControllerBase
{
    private readonly INotificationService _notifications;
    private readonly WebPushOptions _webPushOptions;

    public NotificationsController(
        INotificationService notifications,
        IOptions<WebPushOptions> webPushOptions)
    {
        _notifications = notifications;
        _webPushOptions = webPushOptions.Value;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<NotificationResponseDTO>>> GetNotifications(
        [FromQuery] int take = 25,
        [FromQuery] bool unreadOnly = false,
        CancellationToken cancellationToken = default)
    {
        if (!ApiControllerHelpers.TryGetCurrentUserId(User, out int currentUserId))
        {
            return Unauthorized();
        }

        IReadOnlyList<NotificationEntity> rows = await _notifications.GetUserNotificationsAsync(
            currentUserId,
            take,
            unreadOnly,
            cancellationToken
        );

        return Ok(rows.Select(ToDto).ToList());
    }

    [HttpGet("unread-count")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<NotificationUnreadCountResponseDTO>> GetUnreadCount(
        CancellationToken cancellationToken = default)
    {
        if (!ApiControllerHelpers.TryGetCurrentUserId(User, out int currentUserId))
        {
            return Unauthorized();
        }

        int unreadCount = await _notifications.GetUnreadCountAsync(currentUserId, cancellationToken);
        return Ok(new NotificationUnreadCountResponseDTO
        {
            UnreadCount = unreadCount
        });
    }

    [HttpPut("{notificationId:int}/read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<OperationSuccessResponse>> MarkAsRead(
        int notificationId,
        CancellationToken cancellationToken = default)
    {
        if (!ApiControllerHelpers.TryGetCurrentUserId(User, out int currentUserId))
        {
            return Unauthorized();
        }

        if (notificationId < 1)
        {
            return BadRequest("Invalid notification ID.");
        }

        bool updated = await _notifications.MarkAsReadAsync(currentUserId, notificationId, cancellationToken);
        return Ok(new OperationSuccessResponse
        {
            Success = updated
        });
    }

    [HttpPut("read-all")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<NotificationMarkReadAllResponseDTO>> MarkAllAsRead(
        CancellationToken cancellationToken = default)
    {
        if (!ApiControllerHelpers.TryGetCurrentUserId(User, out int currentUserId))
        {
            return Unauthorized();
        }

        int updatedCount = await _notifications.MarkAllAsReadAsync(currentUserId, cancellationToken);
        return Ok(new NotificationMarkReadAllResponseDTO
        {
            UpdatedCount = updatedCount
        });
    }

    [HttpGet("push-config")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult<PushNotificationConfigResponseDTO> GetPushConfig()
    {
        return Ok(new PushNotificationConfigResponseDTO
        {
            Enabled = _webPushOptions.Enabled && !string.IsNullOrWhiteSpace(_webPushOptions.PublicKey),
            PublicKey = _webPushOptions.PublicKey
        });
    }

    [HttpPost("push-subscriptions")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<OperationSuccessResponse>> UpsertPushSubscription(
        [FromBody] UpsertPushSubscriptionRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!ApiControllerHelpers.TryGetCurrentUserId(User, out int currentUserId))
        {
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(request.Endpoint) ||
            string.IsNullOrWhiteSpace(request.Keys.P256dh) ||
            string.IsNullOrWhiteSpace(request.Keys.Auth))
        {
            return BadRequest("Endpoint and keys are required.");
        }

        await _notifications.UpsertPushSubscriptionAsync(
            currentUserId,
            request.Endpoint,
            request.Keys.P256dh,
            request.Keys.Auth,
            request.UserAgent,
            cancellationToken
        );

        return Ok(new OperationSuccessResponse
        {
            Success = true
        });
    }

    [HttpDelete("push-subscriptions")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<OperationSuccessResponse>> RemovePushSubscription(
        [FromBody] RemovePushSubscriptionRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!ApiControllerHelpers.TryGetCurrentUserId(User, out int currentUserId))
        {
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(request.Endpoint))
        {
            return BadRequest("Endpoint is required.");
        }

        bool removed = await _notifications.DeactivatePushSubscriptionAsync(
            currentUserId,
            request.Endpoint,
            cancellationToken
        );

        return Ok(new OperationSuccessResponse
        {
            Success = removed
        });
    }

    private static NotificationResponseDTO ToDto(NotificationEntity notification)
    {
        return new NotificationResponseDTO
        {
            NotificationId = notification.NotificationID,
            NotificationType = notification.NotificationType,
            Title = notification.Title,
            Body = notification.Body,
            SenderUserId = notification.SenderUserID,
            ConversationId = notification.ConversationID,
            MessageId = notification.MessageID,
            RouteUrl = notification.RouteUrl,
            IsRead = notification.IsRead,
            CreatedAt = notification.CreatedAt,
            ReadAt = notification.ReadAt
        };
    }
}
