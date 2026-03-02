using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDBAPI.Common.Configuration;
using TijarahJoDBAPI.Common.Utils;
using TijarahJoDBAPI.Contracts.Requests;
using TijarahJoDBAPI.Contracts.Responses;

namespace TijarahJoDBAPI.Features.Notifications;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/notifications")]
public sealed class NotificationsController : ControllerBase
{
    private readonly INotificationQueryHandler _notificationQueries;
    private readonly WebPushOptions _webPushOptions;

    public NotificationsController(
        INotificationQueryHandler notificationQueries,
        IOptions<WebPushOptions> webPushOptions)
    {
        _notificationQueries = notificationQueries;
        _webPushOptions = webPushOptions.Value;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<NotificationResponseDTO>>> GetNotifications(
        [FromQuery] int take = 25,
        [FromQuery] bool unreadOnly = false,
        CancellationToken cancellationToken = default)
    {
        if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int currentUserId, out ActionResult? failureResult))
        {
            return failureResult!;
        }

        NotificationListQueryResult result = await _notificationQueries.GetNotificationsAsync(
            currentUserId,
            take,
            unreadOnly,
            cancellationToken
        );
        if (!result.Success)
        {
            return this.ToNotificationListQueryProblem(result, "Failed to fetch notifications.");
        }

        return Ok(result.Notifications.Select(DTOMapper.ToNotificationResponseDTO).ToList());
    }

    [HttpGet("unread-count")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<NotificationUnreadCountResponseDTO>> GetUnreadCount(
        CancellationToken cancellationToken = default)
    {
        if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int currentUserId, out ActionResult? failureResult))
        {
            return failureResult!;
        }

        NotificationUnreadCountQueryResult result = await _notificationQueries.GetUnreadCountAsync(currentUserId, cancellationToken);
        if (!result.Success)
        {
            return this.ToNotificationUnreadCountQueryProblem(result, "Failed to fetch unread count.");
        }

        return Ok(new NotificationUnreadCountResponseDTO
        {
            UnreadCount = result.UnreadCount
        });
    }

    [HttpPut("{notificationId:int}/read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<OperationSuccessResponse>> MarkAsRead(
        int notificationId,
        CancellationToken cancellationToken = default)
    {
        if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int currentUserId, out ActionResult? failureResult))
        {
            return failureResult!;
        }

        NotificationMutationQueryResult result = await _notificationQueries.MarkAsReadAsync(
            currentUserId,
            notificationId,
            cancellationToken);
        if (!result.Success)
        {
            return this.ToNotificationMutationQueryProblem(result, "Failed to mark notification as read.");
        }

        return Ok(new OperationSuccessResponse
        {
            Success = result.Updated
        });
    }

    [HttpPut("read-all")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<NotificationMarkReadAllResponseDTO>> MarkAllAsRead(
        CancellationToken cancellationToken = default)
    {
        if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int currentUserId, out ActionResult? failureResult))
        {
            return failureResult!;
        }

        NotificationMutationQueryResult result = await _notificationQueries.MarkAllAsReadAsync(currentUserId, cancellationToken);
        if (!result.Success)
        {
            return this.ToNotificationMutationQueryProblem(result, "Failed to mark notifications as read.");
        }

        return Ok(new NotificationMarkReadAllResponseDTO
        {
            UpdatedCount = result.UpdatedCount
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
        if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int currentUserId, out ActionResult? failureResult))
        {
            return failureResult!;
        }

        NotificationMutationQueryResult result = await _notificationQueries.UpsertPushSubscriptionAsync(
            new PushSubscriptionUpsertCommand
            {
                UserId = currentUserId,
                Endpoint = request.Endpoint,
                P256dh = request.Keys.P256dh,
                Auth = request.Keys.Auth,
                UserAgent = request.UserAgent
            },
            cancellationToken);
        if (!result.Success)
        {
            return this.ToNotificationMutationQueryProblem(result, "Failed to update push subscription.");
        }

        return Ok(new OperationSuccessResponse
        {
            Success = result.Updated
        });
    }

    [HttpDelete("push-subscriptions")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<OperationSuccessResponse>> RemovePushSubscription(
        [FromBody] RemovePushSubscriptionRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int currentUserId, out ActionResult? failureResult))
        {
            return failureResult!;
        }

        NotificationMutationQueryResult result = await _notificationQueries.RemovePushSubscriptionAsync(
            currentUserId,
            request.Endpoint,
            cancellationToken
        );
        if (!result.Success)
        {
            return this.ToNotificationMutationQueryProblem(result, "Failed to remove push subscription.");
        }

        return Ok(new OperationSuccessResponse
        {
            Success = result.Updated
        });
    }

}
