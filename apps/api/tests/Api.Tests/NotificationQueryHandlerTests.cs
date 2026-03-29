using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Services;

namespace TijarahJo.Api.Tests;

public sealed class NotificationQueryHandlerTests
{
    [Fact]
    public async Task MarkAsReadAsync_ReturnsBadRequest_WhenNotificationIdIsInvalid()
    {
        var notifications = new FakeNotificationService();
        var handler = new NotificationQueryHandler(notifications);

        NotificationMutationQueryResult result = await handler.MarkAsReadAsync(10, 0);

        Assert.False(result.Success);
        Assert.Equal(400, result.StatusCode);
        Assert.Equal(0, notifications.MarkAsReadCalls);
    }

    [Fact]
    public async Task UpsertPushSubscriptionAsync_ReturnsBadRequest_WhenKeysMissing()
    {
        var notifications = new FakeNotificationService();
        var handler = new NotificationQueryHandler(notifications);

        NotificationMutationQueryResult result = await handler.UpsertPushSubscriptionAsync(new PushSubscriptionUpsertCommand
        {
            UserId = 9,
            Endpoint = "https://push.example.com/sub",
            P256dh = "",
            Auth = ""
        });

        Assert.False(result.Success);
        Assert.Equal(400, result.StatusCode);
        Assert.Equal(0, notifications.UpsertCalls);
    }

    [Fact]
    public async Task GetNotificationsAsync_ReturnsRows_FromService()
    {
        var notifications = new FakeNotificationService
        {
            NextRows = new List<NotificationEnvelope>
            {
                new()
                {
                    NotificationId = 1,
                    NotificationType = "CHAT_MESSAGE",
                    Title = "New message",
                    Body = "Hello",
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                }
            }
        };
        var handler = new NotificationQueryHandler(notifications);

        NotificationListQueryResult result = await handler.GetNotificationsAsync(3, 25, false);

        Assert.True(result.Success);
        Assert.Equal(200, result.StatusCode);
        Assert.Single(result.Notifications);
    }

    [Fact]
    public async Task RemovePushSubscriptionAsync_ReturnsUpdatedFlag_FromService()
    {
        var notifications = new FakeNotificationService
        {
            DeactivateResult = true
        };
        var handler = new NotificationQueryHandler(notifications);

        NotificationMutationQueryResult result = await handler.RemovePushSubscriptionAsync(4, "https://push.example.com/sub");

        Assert.True(result.Success);
        Assert.Equal(200, result.StatusCode);
        Assert.True(result.Updated);
    }

    private sealed class FakeNotificationService : INotificationService
    {
        public IReadOnlyList<NotificationEnvelope> NextRows { get; set; } = Array.Empty<NotificationEnvelope>();
        public int MarkAsReadCalls { get; private set; }
        public int UpsertCalls { get; private set; }
        public bool DeactivateResult { get; set; }

        public Task<NotificationEnvelope?> CreateChatMessageNotificationAsync(
            int receiverUserId,
            int senderUserId,
            int conversationId,
            int messageId,
            string messagePreview,
            string? senderDisplayName = null,
            CancellationToken cancellationToken = default)
            => Task.FromResult<NotificationEnvelope?>(null);

        public Task<IReadOnlyList<NotificationEnvelope>> GetUserNotificationsAsync(
            int userId,
            int take = 25,
            bool unreadOnly = false,
            CancellationToken cancellationToken = default)
            => Task.FromResult(NextRows);

        public Task<int> GetUnreadCountAsync(int userId, CancellationToken cancellationToken = default)
            => Task.FromResult(0);

        public Task<bool> MarkAsReadAsync(int userId, int notificationId, CancellationToken cancellationToken = default)
        {
            MarkAsReadCalls++;
            return Task.FromResult(false);
        }

        public Task<int> MarkAllAsReadAsync(int userId, CancellationToken cancellationToken = default)
            => Task.FromResult(0);

        public Task<int> MarkConversationAsReadAsync(int userId, int conversationId, CancellationToken cancellationToken = default)
            => Task.FromResult(0);

        public Task UpsertPushSubscriptionAsync(
            int userId,
            string endpoint,
            string p256dh,
            string auth,
            string? userAgent,
            CancellationToken cancellationToken = default)
        {
            UpsertCalls++;
            return Task.CompletedTask;
        }

        public Task<bool> DeactivatePushSubscriptionAsync(
            int userId,
            string endpoint,
            CancellationToken cancellationToken = default)
            => Task.FromResult(DeactivateResult);
    }
}
