using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TijarahJoDB.DAL.Entities;
using TijarahJoDB.DAL.Persistence;

namespace TijarahJoDBAPI.Common.Services;

public interface INotificationService
{
    Task<NotificationEntity?> CreateChatMessageNotificationAsync(
        int receiverUserId,
        int senderUserId,
        int conversationId,
        int messageId,
        string messagePreview,
        CancellationToken cancellationToken = default
    );

    Task<IReadOnlyList<NotificationEntity>> GetUserNotificationsAsync(
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

public sealed class NotificationService : INotificationService
{
    private const string ChatMessageType = "CHAT_MESSAGE";
    private const int MaxPreviewLength = 140;
    private readonly TijarahJoDbContext _dbContext;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(TijarahJoDbContext dbContext, ILogger<NotificationService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<NotificationEntity?> CreateChatMessageNotificationAsync(
        int receiverUserId,
        int senderUserId,
        int conversationId,
        int messageId,
        string messagePreview,
        CancellationToken cancellationToken = default
    )
    {
        if (receiverUserId < 1 || senderUserId < 1 || conversationId < 1 || messageId < 1)
        {
            return null;
        }

        if (receiverUserId == senderUserId)
        {
            return null;
        }

        string trimmedPreview = (messagePreview ?? string.Empty).Trim();
        if (trimmedPreview.Length > MaxPreviewLength)
        {
            trimmedPreview = trimmedPreview[..(MaxPreviewLength - 3)] + "...";
        }

        if (string.IsNullOrWhiteSpace(trimmedPreview))
        {
            trimmedPreview = "You received a new message.";
        }

        var entity = new NotificationEntity
        {
            UserID = receiverUserId,
            SenderUserID = senderUserId,
            ConversationID = conversationId,
            MessageID = messageId,
            NotificationType = ChatMessageType,
            Title = "New message",
            Body = trimmedPreview,
            RouteUrl = $"/chat/{senderUserId}",
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
            PayloadJson = JsonSerializer.Serialize(new
            {
                type = ChatMessageType,
                senderUserId,
                receiverUserId,
                conversationId,
                messageId
            })
        };

        _dbContext.Notifications.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task<IReadOnlyList<NotificationEntity>> GetUserNotificationsAsync(
        int userId,
        int take = 25,
        bool unreadOnly = false,
        CancellationToken cancellationToken = default
    )
    {
        int normalizedTake = Math.Clamp(take, 1, 100);
        IQueryable<NotificationEntity> query = _dbContext.Notifications
            .AsNoTracking()
            .Where(n => n.UserID == userId);

        if (unreadOnly)
        {
            query = query.Where(n => !n.IsRead);
        }

        return await query
            .OrderByDescending(n => n.CreatedAt)
            .ThenByDescending(n => n.NotificationID)
            .Take(normalizedTake)
            .ToListAsync(cancellationToken);
    }

    public Task<int> GetUnreadCountAsync(int userId, CancellationToken cancellationToken = default)
    {
        return _dbContext.Notifications
            .AsNoTracking()
            .Where(n => n.UserID == userId && !n.IsRead)
            .CountAsync(cancellationToken);
    }

    public async Task<bool> MarkAsReadAsync(
        int userId,
        int notificationId,
        CancellationToken cancellationToken = default
    )
    {
        DateTime utcNow = DateTime.UtcNow;
        int affectedRows = await _dbContext.Notifications
            .Where(n => n.UserID == userId && n.NotificationID == notificationId && !n.IsRead)
            .ExecuteUpdateAsync(updates => updates
                .SetProperty(n => n.IsRead, true)
                .SetProperty(n => n.ReadAt, utcNow), cancellationToken);

        return affectedRows > 0;
    }

    public async Task<int> MarkAllAsReadAsync(int userId, CancellationToken cancellationToken = default)
    {
        DateTime utcNow = DateTime.UtcNow;
        return await _dbContext.Notifications
            .Where(n => n.UserID == userId && !n.IsRead)
            .ExecuteUpdateAsync(updates => updates
                .SetProperty(n => n.IsRead, true)
                .SetProperty(n => n.ReadAt, utcNow), cancellationToken);
    }

    public async Task<int> MarkConversationAsReadAsync(
        int userId,
        int conversationId,
        CancellationToken cancellationToken = default
    )
    {
        if (conversationId < 1)
        {
            return 0;
        }

        DateTime utcNow = DateTime.UtcNow;
        return await _dbContext.Notifications
            .Where(n =>
                n.UserID == userId &&
                !n.IsRead &&
                n.NotificationType == ChatMessageType &&
                n.ConversationID == conversationId)
            .ExecuteUpdateAsync(updates => updates
                .SetProperty(n => n.IsRead, true)
                .SetProperty(n => n.ReadAt, utcNow), cancellationToken);
    }

    public async Task UpsertPushSubscriptionAsync(
        int userId,
        string endpoint,
        string p256dh,
        string auth,
        string? userAgent,
        CancellationToken cancellationToken = default
    )
    {
        string normalizedEndpoint = endpoint.Trim();
        string normalizedP256dh = p256dh.Trim();
        string normalizedAuth = auth.Trim();

        PushSubscriptionEntity? existing = await _dbContext.PushSubscriptions
            .FirstOrDefaultAsync(
                s => s.UserID == userId && s.Endpoint == normalizedEndpoint,
                cancellationToken
            );

        DateTime utcNow = DateTime.UtcNow;

        if (existing is null)
        {
            _dbContext.PushSubscriptions.Add(new PushSubscriptionEntity
            {
                UserID = userId,
                Endpoint = normalizedEndpoint,
                P256DH = normalizedP256dh,
                Auth = normalizedAuth,
                UserAgent = string.IsNullOrWhiteSpace(userAgent) ? null : userAgent.Trim(),
                IsActive = true,
                CreatedAt = utcNow,
                UpdatedAt = utcNow
            });
        }
        else
        {
            existing.P256DH = normalizedP256dh;
            existing.Auth = normalizedAuth;
            existing.UserAgent = string.IsNullOrWhiteSpace(userAgent) ? null : userAgent.Trim();
            existing.IsActive = true;
            existing.UpdatedAt = utcNow;
            existing.LastFailureAt = null;
            existing.LastFailureReason = null;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> DeactivatePushSubscriptionAsync(
        int userId,
        string endpoint,
        CancellationToken cancellationToken = default
    )
    {
        string normalizedEndpoint = endpoint.Trim();
        DateTime utcNow = DateTime.UtcNow;

        int affectedRows = await _dbContext.PushSubscriptions
            .Where(s => s.UserID == userId && s.Endpoint == normalizedEndpoint && s.IsActive)
            .ExecuteUpdateAsync(updates => updates
                .SetProperty(s => s.IsActive, false)
                .SetProperty(s => s.UpdatedAt, utcNow), cancellationToken);

        if (affectedRows == 0)
        {
            _logger.LogInformation(
                "Push subscription deactivate request had no active row. userId={UserId}, endpoint={Endpoint}",
                userId,
                normalizedEndpoint
            );
        }

        return affectedRows > 0;
    }
}
