using System.ComponentModel.DataAnnotations;

namespace TijarahJo.Api.Contracts.Requests;

public sealed class RemovePushSubscriptionRequest
{
    [Required]
    [MaxLength(1000)]
    public string Endpoint { get; set; } = string.Empty;
}
