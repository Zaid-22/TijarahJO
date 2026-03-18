using System.Text.Json.Serialization;

namespace TijarahJo.Api.Contracts.Responses;

public sealed class NotificationResponseDTO
{
    [JsonPropertyName("notificationId")]
    public int NotificationId { get; set; }

    [JsonPropertyName("notificationType")]
    public string NotificationType { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("body")]
    public string Body { get; set; } = string.Empty;

    [JsonPropertyName("senderUserId")]
    public int? SenderUserId { get; set; }

    [JsonPropertyName("conversationId")]
    public int? ConversationId { get; set; }

    [JsonPropertyName("messageId")]
    public int? MessageId { get; set; }

    [JsonPropertyName("routeUrl")]
    public string? RouteUrl { get; set; }

    [JsonPropertyName("isRead")]
    public bool IsRead { get; set; }

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("readAt")]
    public DateTime? ReadAt { get; set; }
}

public sealed class NotificationUnreadCountResponseDTO
{
    [JsonPropertyName("unreadCount")]
    public int UnreadCount { get; set; }
}

public sealed class NotificationMarkReadAllResponseDTO
{
    [JsonPropertyName("updatedCount")]
    public int UpdatedCount { get; set; }
}

public sealed class PushNotificationConfigResponseDTO
{
    [JsonPropertyName("enabled")]
    public bool Enabled { get; set; }

    [JsonPropertyName("publicKey")]
    public string PublicKey { get; set; } = string.Empty;
}
