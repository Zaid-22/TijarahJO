using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Application.Services;

public sealed class NotificationQueryHandler : INotificationQueryHandler
{
    private readonly INotificationService _notifications;

    public NotificationQueryHandler(INotificationService notifications)
    {
        _notifications = notifications;
    }

    public async Task<NotificationListQueryResult> GetNotificationsAsync(
        int userId,
        int take,
        bool unreadOnly,
        CancellationToken cancellationToken = default
    )
    {
        if (userId < 1)
        {
            return UnauthorizedList();
        }

        IReadOnlyList<NotificationEnvelope> rows = await _notifications.GetUserNotificationsAsync(
            userId,
            take,
            unreadOnly,
            cancellationToken
        );

        return new NotificationListQueryResult
        {
            Success = true,
            StatusCode = 200,
            Notifications = rows
        };
    }

    public async Task<NotificationUnreadCountQueryResult> GetUnreadCountAsync(
        int userId,
        CancellationToken cancellationToken = default
    )
    {
        if (userId < 1)
        {
            return new NotificationUnreadCountQueryResult
            {
                Success = false,
                StatusCode = 401,
                Message = "Invalid authentication token."
            };
        }

        int unreadCount = await _notifications.GetUnreadCountAsync(userId, cancellationToken);
        return new NotificationUnreadCountQueryResult
        {
            Success = true,
            StatusCode = 200,
            UnreadCount = unreadCount
        };
    }

    public async Task<NotificationMutationQueryResult> MarkAsReadAsync(
        int userId,
        int notificationId,
        CancellationToken cancellationToken = default
    )
    {
        if (userId < 1)
        {
            return UnauthorizedMutation();
        }

        if (notificationId < 1)
        {
            return new NotificationMutationQueryResult
            {
                Success = false,
                StatusCode = 400,
                Message = "Invalid notification ID."
            };
        }

        bool updated = await _notifications.MarkAsReadAsync(userId, notificationId, cancellationToken);
        return new NotificationMutationQueryResult
        {
            Success = true,
            StatusCode = 200,
            Updated = updated
        };
    }

    public async Task<NotificationMutationQueryResult> MarkAllAsReadAsync(
        int userId,
        CancellationToken cancellationToken = default
    )
    {
        if (userId < 1)
        {
            return UnauthorizedMutation();
        }

        int updatedCount = await _notifications.MarkAllAsReadAsync(userId, cancellationToken);
        return new NotificationMutationQueryResult
        {
            Success = true,
            StatusCode = 200,
            UpdatedCount = updatedCount
        };
    }

    public async Task<NotificationMutationQueryResult> UpsertPushSubscriptionAsync(
        PushSubscriptionUpsertCommand command,
        CancellationToken cancellationToken = default
    )
    {
        if (command.UserId < 1)
        {
            return UnauthorizedMutation();
        }

        if (string.IsNullOrWhiteSpace(command.Endpoint) ||
            string.IsNullOrWhiteSpace(command.P256dh) ||
            string.IsNullOrWhiteSpace(command.Auth))
        {
            return new NotificationMutationQueryResult
            {
                Success = false,
                StatusCode = 400,
                Message = "Endpoint and keys are required."
            };
        }

        await _notifications.UpsertPushSubscriptionAsync(
            command.UserId,
            command.Endpoint,
            command.P256dh,
            command.Auth,
            command.UserAgent,
            cancellationToken
        );

        return new NotificationMutationQueryResult
        {
            Success = true,
            StatusCode = 200,
            Updated = true
        };
    }

    public async Task<NotificationMutationQueryResult> RemovePushSubscriptionAsync(
        int userId,
        string? endpoint,
        CancellationToken cancellationToken = default
    )
    {
        if (userId < 1)
        {
            return UnauthorizedMutation();
        }

        if (string.IsNullOrWhiteSpace(endpoint))
        {
            return new NotificationMutationQueryResult
            {
                Success = false,
                StatusCode = 400,
                Message = "Endpoint is required."
            };
        }

        bool removed = await _notifications.DeactivatePushSubscriptionAsync(
            userId,
            endpoint,
            cancellationToken
        );

        return new NotificationMutationQueryResult
        {
            Success = true,
            StatusCode = 200,
            Updated = removed
        };
    }

    private static NotificationListQueryResult UnauthorizedList()
        => new()
        {
            Success = false,
            StatusCode = 401,
            Message = "Invalid authentication token."
        };

    private static NotificationMutationQueryResult UnauthorizedMutation()
        => new()
        {
            Success = false,
            StatusCode = 401,
            Message = "Invalid authentication token."
        };
}
