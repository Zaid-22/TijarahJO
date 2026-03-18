using TijarahJo.Domain.Models;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.Application.Services;
using TijarahJoDB.BLL;

namespace TijarahJo.Api.Tests;

public sealed class ChatOrchestrationServiceTests
{
    [Fact]
    public async Task GetPresenceAsync_ReturnsInvalidRequest_WhenIdsAreNonPositive()
    {
        var service = CreateService(new FakePresenceLookup());

        ChatServiceResult<ChatPresenceSnapshot> result = await service.GetPresenceAsync(0, 5);

        Assert.False(result.Success);
        Assert.Equal(ChatFailureReason.InvalidRequest, result.FailureReason);
        Assert.Equal("Invalid chat user ID.", result.Message);
    }

    [Fact]
    public async Task GetPresenceAsync_ReturnsOnlineWithoutLookup_WhenUserChecksSelf()
    {
        var lookup = new FakePresenceLookup
        {
            IsOnlineResult = false
        };
        var service = CreateService(lookup);

        ChatServiceResult<ChatPresenceSnapshot> result = await service.GetPresenceAsync(8, 8);

        Assert.True(result.Success);
        Assert.NotNull(result.Value);
        Assert.True(result.Value!.IsOnline);
        Assert.Equal("Online", result.Value.StatusText);
        Assert.NotNull(result.Value.LastSeenAtUtc);
        Assert.Equal(0, lookup.IsUserOnlineCalls);
    }

    [Fact]
    public async Task GetPresenceAsync_ReturnsOfflineAndLastSeen_WhenLookupReportsOffline()
    {
        var lastSeenUtc = DateTime.UtcNow.AddMinutes(-12);
        var lookup = new FakePresenceLookup
        {
            IsOnlineResult = false,
            LastSeenUtc = lastSeenUtc,
            HasLastSeen = true
        };
        var service = CreateService(lookup);

        ChatServiceResult<ChatPresenceSnapshot> result = await service.GetPresenceAsync(10, 22);

        Assert.True(result.Success);
        Assert.NotNull(result.Value);
        Assert.False(result.Value!.IsOnline);
        Assert.Equal("Offline", result.Value.StatusText);
        Assert.Equal(lastSeenUtc, result.Value.LastSeenAtUtc);
        Assert.Equal(1, lookup.IsUserOnlineCalls);
    }

    [Fact]
    public async Task GetHistoryAsync_UsesRecentConversationForOtherUser_WhenAvailable()
    {
        var now = DateTime.UtcNow;
        var messages = new FakeMessageService
        {
            CanAccessConversationResult = true,
            NextConversationId = 999
        };
        messages.RecentChatsResult.Add(new MessageModel(
            messageId: 1,
            senderId: 22,
            conversationId: 55,
            content: "latest",
            timestamp: now,
            isRead: false,
            receiverId: 10,
            postId: 3));
        messages.HistoryByConversationId[55] =
        [
            new(
                messageId: 2,
                senderId: 22,
                conversationId: 55,
                content: "history item",
                timestamp: now,
                isRead: false,
                receiverId: 10,
                postId: 3)
        ];
        var service = CreateService(messages, new FakeNotificationService(), new FakePresenceLookup());

        ChatServiceResult<IReadOnlyList<ChatMessageEnvelope>> result = await service.GetHistoryAsync(10, 22);

        Assert.True(result.Success);
        Assert.NotNull(result.Value);
        Assert.Single(result.Value!);
        Assert.Equal(55, messages.LastGetChatHistoryConversationId);
        Assert.Equal(55, messages.LastMarkAsReadConversationId);
        Assert.Equal(0, messages.GetOrCreateConversationIdCalls);
    }

    [Fact]
    public async Task GetHistoryAsync_FallsBackToCanonicalConversation_WhenRecentConversationIsMissing()
    {
        var now = DateTime.UtcNow;
        var messages = new FakeMessageService
        {
            CanAccessConversationResult = true,
            NextConversationId = 77
        };
        messages.RecentChatsResult.Add(new MessageModel(
            messageId: 11,
            senderId: 90,
            conversationId: 12,
            content: "other chat",
            timestamp: now,
            isRead: false,
            receiverId: 10,
            postId: null));
        messages.HistoryByConversationId[77] =
        [
            new(
                messageId: 12,
                senderId: 10,
                conversationId: 77,
                content: "fallback",
                timestamp: now,
                isRead: true,
                receiverId: 22,
                postId: null)
        ];
        var service = CreateService(messages, new FakeNotificationService(), new FakePresenceLookup());

        ChatServiceResult<IReadOnlyList<ChatMessageEnvelope>> result = await service.GetHistoryAsync(10, 22);

        Assert.True(result.Success);
        Assert.NotNull(result.Value);
        Assert.Single(result.Value!);
        Assert.Equal(77, messages.LastGetChatHistoryConversationId);
        Assert.Equal(77, messages.LastMarkAsReadConversationId);
        Assert.Equal(1, messages.GetOrCreateConversationIdCalls);
    }

    [Fact]
    public async Task SendRealtimeMessageAsync_ReturnsInvalidRequest_WhenReceiverIdIsNotNumeric()
    {
        var messages = new FakeMessageService();
        var service = CreateService(messages, new FakeNotificationService(), new FakePresenceLookup());

        ChatServiceResult<SendChatMessageOutcome> result = await service.SendRealtimeMessageAsync(new SendRealtimeChatMessageCommand
        {
            SenderUserId = 12,
            ReceiverId = "abc",
            Content = "hello"
        });

        Assert.False(result.Success);
        Assert.Equal(ChatFailureReason.InvalidRequest, result.FailureReason);
        Assert.Equal("Invalid receiver identifier.", result.Message);
        Assert.Equal(0, messages.GetOrCreateConversationIdCalls);
    }

    [Fact]
    public async Task SendRealtimeMessageAsync_DelegatesToSendMessageFlow_WhenPayloadIsValid()
    {
        var messages = new FakeMessageService
        {
            NextConversationId = 99,
            CanAccessConversationResult = true,
            SaveAsyncResult = true
        };
        var service = CreateService(messages, new FakeNotificationService(), new FakePresenceLookup());

        ChatServiceResult<SendChatMessageOutcome> result = await service.SendRealtimeMessageAsync(new SendRealtimeChatMessageCommand
        {
            SenderUserId = 10,
            ReceiverId = "20",
            PostId = 5,
            Content = "  hello world  "
        });

        Assert.True(result.Success);
        Assert.NotNull(result.Value);
        Assert.Equal(20, result.Value!.ReceiverId);
        Assert.Equal(99, result.Value.ConversationId);
        Assert.Equal("hello world", result.Value.Message.Message.Content);
        Assert.Equal(1, messages.GetOrCreateConversationIdCalls);
        Assert.Equal(1, messages.SaveAsyncCalls);
    }

    private static ChatOrchestrationService CreateService(
        FakeMessageService messages,
        FakeNotificationService notifications,
        FakePresenceLookup lookup)
    {
        return new ChatOrchestrationService(
            messages,
            notifications,
            lookup,
            new FakeUserQueryHandler()
        );
    }

    private static ChatOrchestrationService CreateService(FakePresenceLookup lookup)
        => CreateService(new FakeMessageService(), new FakeNotificationService(), lookup);

    private sealed class FakePresenceLookup : IChatPresenceLookup
    {
        public bool IsOnlineResult { get; set; }
        public bool HasLastSeen { get; set; }
        public DateTime LastSeenUtc { get; set; }
        public int IsUserOnlineCalls { get; private set; }

        public Task<bool> IsUserOnlineAsync(int userId, CancellationToken cancellationToken = default)
        {
            IsUserOnlineCalls++;
            return Task.FromResult(IsOnlineResult);
        }

        public Task<DateTime?> GetLastSeenUtcAsync(int userId, CancellationToken cancellationToken = default)
            => Task.FromResult(HasLastSeen ? (DateTime?)LastSeenUtc : null);
    }

    private sealed class FakeMessageService : IMessageService
    {
        public int? NextConversationId { get; set; }
        public bool CanAccessConversationResult { get; set; }
        public bool SaveAsyncResult { get; set; } = true;
        public int GetOrCreateConversationIdCalls { get; private set; }
        public int GetRecentChatsCalls { get; private set; }
        public int SaveAsyncCalls { get; private set; }
        public int? LastGetChatHistoryConversationId { get; private set; }
        public int? LastMarkAsReadConversationId { get; private set; }
        public List<MessageModel> RecentChatsResult { get; } = [];
        public Dictionary<int, List<MessageModel>> HistoryByConversationId { get; } = [];

        public Task<int?> GetOrCreateConversationIdAsync(int userA, int userB, int? postId = null, CancellationToken cancellationToken = default)
        {
            GetOrCreateConversationIdCalls++;
            return Task.FromResult(NextConversationId);
        }

        public Task<bool> CanAccessConversationAsync(int userId, int conversationId, CancellationToken cancellationToken = default)
            => Task.FromResult(CanAccessConversationResult);

        public Task<ConversationAccessMetadata?> GetConversationMetadataAsync(int conversationId, CancellationToken cancellationToken = default)
            => Task.FromResult<ConversationAccessMetadata?>(null);

        public Task<List<MessageModel>> GetChatHistoryAsync(int conversationId, CancellationToken cancellationToken = default)
        {
            LastGetChatHistoryConversationId = conversationId;
            if (HistoryByConversationId.TryGetValue(conversationId, out List<MessageModel>? history))
            {
                return Task.FromResult(new List<MessageModel>(history));
            }

            return Task.FromResult(new List<MessageModel>());
        }

        public Task<List<MessageModel>> GetRecentChatsAsync(int userId, CancellationToken cancellationToken = default)
        {
            GetRecentChatsCalls++;
            return Task.FromResult(new List<MessageModel>(RecentChatsResult));
        }

        public Task<bool> MarkAsReadAsync(int conversationId, int receiverId, CancellationToken cancellationToken = default)
        {
            LastMarkAsReadConversationId = conversationId;
            return Task.FromResult(true);
        }

        public Message Create(MessageModel model)
            => new(model);

        public Task<bool> SaveAsync(Message message, CancellationToken cancellationToken = default)
        {
            SaveAsyncCalls++;
            if (message.MessageModel.MessageId is null)
            {
                message.MessageModel = message.MessageModel with { MessageId = 123 };
            }

            return Task.FromResult(SaveAsyncResult);
        }
    }

    private sealed class FakeNotificationService : INotificationService
    {
        public Task<NotificationEnvelope?> CreateChatMessageNotificationAsync(
            int receiverUserId,
            int senderUserId,
            int conversationId,
            int messageId,
            string messagePreview,
            CancellationToken cancellationToken = default)
            => Task.FromResult<NotificationEnvelope?>(null);

        public Task<IReadOnlyList<NotificationEnvelope>> GetUserNotificationsAsync(
            int userId,
            int take = 25,
            bool unreadOnly = false,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<NotificationEnvelope>>([]);

        public Task<int> GetUnreadCountAsync(int userId, CancellationToken cancellationToken = default)
            => Task.FromResult(0);

        public Task<bool> MarkAsReadAsync(int userId, int notificationId, CancellationToken cancellationToken = default)
            => Task.FromResult(true);

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
            => Task.CompletedTask;

        public Task<bool> DeactivatePushSubscriptionAsync(
            int userId,
            string endpoint,
            CancellationToken cancellationToken = default)
            => Task.FromResult(true);
    }

    private sealed class FakeUserQueryHandler : IUserQueryHandler
    {
        public Task<UserListQueryResult> GetAllAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
            => Task.FromResult(new UserListQueryResult { Success = true });

        public Task<UserByIdQueryResult> GetByIdAsync(UserByIdQuery query, CancellationToken cancellationToken = default)
            => Task.FromResult(new UserByIdQueryResult { Success = false });

        public Task<UserExistsQueryResult> ExistsAsync(int userId, CancellationToken cancellationToken = default)
            => Task.FromResult(new UserExistsQueryResult { Success = true, Exists = false });
    }
}
