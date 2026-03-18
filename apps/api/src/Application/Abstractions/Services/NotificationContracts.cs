using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TijarahJo.Application.Abstractions.Services;

public sealed class NotificationEnvelope
{
    public int NotificationId { get; init; }
    public string NotificationType { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Body { get; init; } = string.Empty;
    public int? SenderUserId { get; init; }
    public int? ConversationId { get; init; }
    public int? MessageId { get; init; }
    public string? RouteUrl { get; init; }
    public bool IsRead { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? ReadAt { get; init; }
}

public interface INotificationService
{
    Task<NotificationEnvelope?> CreateChatMessageNotificationAsync(
        int receiverUserId,
        int senderUserId,
        int conversationId,
        int messageId,
        string messagePreview,
        CancellationToken cancellationToken = default
    );

    Task<IReadOnlyList<NotificationEnvelope>> GetUserNotificationsAsync(
        int userId,
        int take = 25,
        bool unreadOnly = false,
        CancellationToken cancellationToken = default
    );

    Task<int> GetUnreadCountAsync(int userId, CancellationToken cancellationToken = default);

    Task<bool> MarkAsReadAsync(
        int userId,
        int notificationId,
        CancellationToken cancellationToken = default
    );

    Task<int> MarkAllAsReadAsync(int userId, CancellationToken cancellationToken = default);

    Task<int> MarkConversationAsReadAsync(
        int userId,
        int conversationId,
        CancellationToken cancellationToken = default
    );

    Task UpsertPushSubscriptionAsync(
        int userId,
        string endpoint,
        string p256dh,
        string auth,
        string? userAgent,
        CancellationToken cancellationToken = default
    );

    Task<bool> DeactivatePushSubscriptionAsync(
        int userId,
        string endpoint,
        CancellationToken cancellationToken = default
    );
}
