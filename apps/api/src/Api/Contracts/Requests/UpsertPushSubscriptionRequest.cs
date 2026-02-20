using System.ComponentModel.DataAnnotations;

namespace TijarahJoDBAPI.Contracts.Requests;

public sealed class UpsertPushSubscriptionRequest
{
    [Required]
    [MaxLength(1000)]
    public string Endpoint { get; set; } = string.Empty;

    [Required]
    public PushSubscriptionKeysRequest Keys { get; set; } = new();

    [MaxLength(500)]
    public string? UserAgent { get; set; }
}

public sealed class PushSubscriptionKeysRequest
{
    [Required]
    [MaxLength(255)]
    public string P256dh { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string Auth { get; set; } = string.Empty;
}
