using TijarahJo.Domain.Models;

namespace TijarahJo.Application.Abstractions.Services;

public enum ChatFailureReason
{
    InvalidRequest,
    NotFound,
    Forbidden,
    PersistenceFailed
}

public sealed class ChatServiceResult<T>
{
    public bool Success { get; init; }
    public T? Value { get; init; }
    public ChatFailureReason? FailureReason { get; init; }
    public string? Message { get; init; }
}

public sealed class ChatMessageEnvelope
{
    public required MessageModel Message { get; init; }
    public required int ReceiverId { get; init; }
    public int? PostId { get; init; }
}

public sealed class SendChatMessageCommand
{
    public int SenderUserId { get; init; }
    public int? ConversationId { get; init; }
    public int? ReceiverId { get; init; }
    public int? PostId { get; init; }
    public string? Content { get; init; }
}

public sealed class SendRealtimeChatMessageCommand
{
    public int SenderUserId { get; init; }
    public string? ReceiverId { get; init; }
    public int? PostId { get; init; }
    public string? Content { get; init; }
}

public sealed class SendChatMessageOutcome
{
    public required ChatMessageEnvelope Message { get; init; }
    public required int ConversationId { get; init; }
    public required int ReceiverId { get; init; }
    public int? PostId { get; init; }
    public NotificationEnvelope? Notification { get; init; }
}

public sealed class ChatPresenceSnapshot
{
    public required int UserId { get; init; }
    public required bool IsOnline { get; init; }
    public DateTime? LastSeenAtUtc { get; init; }
    public string? StatusText { get; init; }
}

public interface IChatPresenceLookup
{
    Task<bool> IsUserOnlineAsync(int userId, CancellationToken cancellationToken = default);
    Task<DateTime?> GetLastSeenUtcAsync(int userId, CancellationToken cancellationToken = default);
}

public interface IChatOrchestrationService
{
    Task<ChatServiceResult<IReadOnlyList<ChatMessageEnvelope>>> GetHistoryAsync(
        int currentUserId,
        int otherUserId,
        CancellationToken cancellationToken = default
    );

    Task<ChatServiceResult<IReadOnlyList<ChatMessageEnvelope>>> GetRecentChatsAsync(
        int currentUserId,
        CancellationToken cancellationToken = default
    );

    Task<ChatServiceResult<ChatPresenceSnapshot>> GetPresenceAsync(
        int currentUserId,
        int otherUserId,
        CancellationToken cancellationToken = default
    );

    Task<ChatServiceResult<SendChatMessageOutcome>> SendMessageAsync(
        SendChatMessageCommand command,
        CancellationToken cancellationToken = default
    );

    Task<ChatServiceResult<SendChatMessageOutcome>> SendRealtimeMessageAsync(
        SendRealtimeChatMessageCommand command,
        CancellationToken cancellationToken = default
    );
}
