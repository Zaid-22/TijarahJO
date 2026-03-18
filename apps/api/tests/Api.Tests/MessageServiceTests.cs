using TijarahJo.Domain.Models;
using TijarahJoDB.Application.Abstractions.DataAccess;
using TijarahJoDB.Application.Services;
using TijarahJoDB.BLL;

namespace TijarahJo.Api.Tests;

public sealed class MessageServiceTests
{
    [Fact]
    public async Task SaveAsync_ReturnsFalse_WhenSenderIsNotInConversation()
    {
        var messages = new FakeMessageDataAccess();
        var conversations = new FakeConversationDataAccess();
        var service = new MessageService(messages, conversations);

        var message = new Message(
            new MessageModel(null, senderId: 10, conversationId: 99, content: "hello", timestamp: DateTime.UtcNow, isRead: false)
        );

        bool saved = await service.SaveAsync(message);

        Assert.False(saved);
        Assert.Equal(0, messages.AddCalls);
    }

    [Fact]
    public async Task SaveAsync_ReturnsTrue_AndAssignsMessageId_WhenSenderBelongsToConversation()
    {
        var messages = new FakeMessageDataAccess { NextMessageId = 42 };
        var conversations = new FakeConversationDataAccess();
        conversations.AllowUser(77, 10);
        var service = new MessageService(messages, conversations);

        var message = new Message(
            new MessageModel(null, senderId: 10, conversationId: 77, content: "hello", timestamp: DateTime.UtcNow, isRead: false)
        );

        bool saved = await service.SaveAsync(message);

        Assert.True(saved);
        Assert.Equal(1, messages.AddCalls);
        Assert.Equal(42, message.MessageModel.MessageId);
    }

    [Fact]
    public async Task SaveAsync_ReturnsFalse_WhenConversationIdIsInvalid()
    {
        var messages = new FakeMessageDataAccess();
        var conversations = new FakeConversationDataAccess();
        var service = new MessageService(messages, conversations);

        var message = new Message(
            new MessageModel(null, senderId: 10, conversationId: 0, content: "hello", timestamp: DateTime.UtcNow, isRead: false)
        );

        bool saved = await service.SaveAsync(message);

        Assert.False(saved);
        Assert.Equal(0, messages.AddCalls);
    }

    private sealed class FakeMessageDataAccess : IMessageDataAccess
    {
        public int AddCalls { get; private set; }
        public int NextMessageId { get; set; } = 1;

        public Task<int> AddMessageAsync(MessageModel message, CancellationToken cancellationToken = default)
        {
            AddCalls++;
            return Task.FromResult(NextMessageId);
        }

        public Task<IReadOnlyList<MessageModel>> GetChatHistoryAsync(int conversationId, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<MessageModel>>(Array.Empty<MessageModel>());

        public Task<IReadOnlyList<MessageModel>> GetRecentChatsAsync(int userId, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<MessageModel>>(Array.Empty<MessageModel>());

        public Task<bool> MarkMessagesAsReadAsync(int conversationId, int receiverId, CancellationToken cancellationToken = default)
            => Task.FromResult(false);
    }

    private sealed class FakeConversationDataAccess : IConversationDataAccess
    {
        private readonly HashSet<(int ConversationId, int UserId)> _allowed = new();

        public Task<int?> FindConversationIdAsync(int user1Id, int user2Id, int? postId, CancellationToken cancellationToken = default)
            => Task.FromResult<int?>(null);

        public Task<int?> CreateConversationAsync(int user1Id, int user2Id, int? postId, CancellationToken cancellationToken = default)
            => Task.FromResult<int?>(null);

        public Task<bool> IsUserInConversationAsync(int conversationId, int userId, CancellationToken cancellationToken = default)
            => Task.FromResult(_allowed.Contains((conversationId, userId)));

        public Task<ConversationMetadataModel?> GetConversationMetadataAsync(int conversationId, CancellationToken cancellationToken = default)
            => Task.FromResult<ConversationMetadataModel?>(null);

        public void AllowUser(int conversationId, int userId)
            => _allowed.Add((conversationId, userId));
    }
}
