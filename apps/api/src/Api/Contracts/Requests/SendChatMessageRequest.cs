using System.ComponentModel.DataAnnotations;

namespace TijarahJoDBAPI.Contracts.Requests;

public sealed class SendChatMessageRequest
{
    [Range(1, int.MaxValue)]
    public int? ConversationId { get; set; }

    [Range(1, int.MaxValue)]
    public int? ReceiverId { get; set; }

    [Range(1, int.MaxValue)]
    public int? PostId { get; set; }

    [Required]
    [MaxLength(4000)]
    public string Content { get; set; } = string.Empty;
}
