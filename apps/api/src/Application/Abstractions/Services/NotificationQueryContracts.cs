namespace TijarahJoDB.Application.Abstractions.Services;

public sealed class NotificationListQueryResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string? Message { get; init; }
    public IReadOnlyList<NotificationEnvelope> Notifications { get; init; } = Array.Empty<NotificationEnvelope>();
}

public sealed class NotificationUnreadCountQueryResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string? Message { get; init; }
    public int UnreadCount { get; init; }
}

public sealed class NotificationMutationQueryResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string? Message { get; init; }
    public bool Updated { get; init; }
    public int UpdatedCount { get; init; }
}

public sealed class PushSubscriptionUpsertCommand
{
    public int UserId { get; init; }
    public string? Endpoint { get; init; }
    public string? P256dh { get; init; }
    public string? Auth { get; init; }
    public string? UserAgent { get; init; }
}

public interface INotificationQueryHandler
{
    Task<NotificationListQueryResult> GetNotificationsAsync(
        int userId,
        int take,
        bool unreadOnly,
        CancellationToken cancellationToken = default
    );

    Task<NotificationUnreadCountQueryResult> GetUnreadCountAsync(
        int userId,
        CancellationToken cancellationToken = default
    );

    Task<NotificationMutationQueryResult> MarkAsReadAsync(
        int userId,
        int notificationId,
        CancellationToken cancellationToken = default
    );

    Task<NotificationMutationQueryResult> MarkAllAsReadAsync(
        int userId,
        CancellationToken cancellationToken = default
    );

    Task<NotificationMutationQueryResult> UpsertPushSubscriptionAsync(
        PushSubscriptionUpsertCommand command,
        CancellationToken cancellationToken = default
    );

    Task<NotificationMutationQueryResult> RemovePushSubscriptionAsync(
        int userId,
        string? endpoint,
        CancellationToken cancellationToken = default
    );
}
