namespace TijarahJo.Api.Contracts.Responses;

public class MessageResponseDTO
{
    public int MessageId { get; set; }
    public string Id { get; set; } = string.Empty;
    public int SenderId { get; set; }
    public int ReceiverId { get; set; }
    public int ConversationId { get; set; }
    public int? PostId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public bool IsRead { get; set; }
}
