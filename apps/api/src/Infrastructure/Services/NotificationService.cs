using System.Text.Json;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Domain.Entities;
using TijarahJo.Infrastructure.Persistence;

namespace TijarahJo.Infrastructure.Services;

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

    public async Task<NotificationEnvelope?> CreateChatMessageNotificationAsync(
        int receiverUserId,
        int senderUserId,
        int conversationId,
        int messageId,
        string messagePreview,
        string? senderDisplayName = null,
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
            Title = string.IsNullOrWhiteSpace(senderDisplayName)
                ? "New message"
                : $"New message from {senderDisplayName.Trim()}",
            Body = trimmedPreview,
            RouteUrl = $"/chat/{senderUserId}?conversationId={conversationId}",
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
        return ToEnvelope(entity);
    }

    public async Task<IReadOnlyList<NotificationEnvelope>> GetUserNotificationsAsync(
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

        List<NotificationEntity> rows = await query
            .OrderByDescending(n => n.CreatedAt)
            .ThenByDescending(n => n.NotificationID)
            .Take(normalizedTake)
            .ToListAsync(cancellationToken);

        return rows.Select(ToEnvelope).ToList();
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
        byte[] endpointHash = ComputeEndpointHash(normalizedEndpoint);

        PushSubscriptionEntity? existing = await _dbContext.PushSubscriptions
            .FirstOrDefaultAsync(
                s => s.UserID == userId && EF.Property<byte[]>(s, "EndpointHash") == endpointHash,
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
        byte[] endpointHash = ComputeEndpointHash(normalizedEndpoint);
        DateTime utcNow = DateTime.UtcNow;

        int affectedRows = await _dbContext.PushSubscriptions
            .Where(s => s.UserID == userId && EF.Property<byte[]>(s, "EndpointHash") == endpointHash && s.IsActive)
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

    private static NotificationEnvelope ToEnvelope(NotificationEntity entity)
    {
        return new NotificationEnvelope
        {
            NotificationId = entity.NotificationID,
            NotificationType = entity.NotificationType,
            Title = entity.Title,
            Body = entity.Body,
            SenderUserId = entity.SenderUserID,
            ConversationId = entity.ConversationID,
            MessageId = entity.MessageID,
            RouteUrl = entity.RouteUrl,
            IsRead = entity.IsRead,
            CreatedAt = entity.CreatedAt,
            ReadAt = entity.ReadAt
        };
    }

    private static byte[] ComputeEndpointHash(string endpoint)
    {
        string canonicalEndpoint = endpoint.Trim().ToLowerInvariant();
        return SHA256.HashData(Encoding.UTF8.GetBytes(canonicalEndpoint));
    }
}
