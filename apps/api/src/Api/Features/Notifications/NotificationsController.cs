using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Api.Common.Utils;
using TijarahJo.Api.Contracts.Responses;

namespace TijarahJo.Api.Features.Notifications;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/notifications")]
public sealed class NotificationsController(
    INotificationQueryHandler notificationQueries) : ControllerBase
{

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

        NotificationListQueryResult result = await notificationQueries.GetNotificationsAsync(
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

        NotificationUnreadCountQueryResult result = await notificationQueries.GetUnreadCountAsync(currentUserId, cancellationToken);
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

        NotificationMutationQueryResult result = await notificationQueries.MarkAsReadAsync(
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

        NotificationMutationQueryResult result = await notificationQueries.MarkAllAsReadAsync(currentUserId, cancellationToken);
        if (!result.Success)
        {
            return this.ToNotificationMutationQueryProblem(result, "Failed to mark notifications as read.");
        }

        return Ok(new NotificationMarkReadAllResponseDTO
        {
            UpdatedCount = result.UpdatedCount
        });
    }
}
