using System.ComponentModel.DataAnnotations;

namespace TijarahJo.Api.Contracts.Requests;

/// <summary>
/// Request parameters for the posts feed endpoint.
/// </summary>
public sealed class PostsFeedRequest
{
    [Range(1, int.MaxValue)]
    public int? Page { get; set; } = 1;

    [Range(1, 200)]
    public int? Limit { get; set; } = 20;
}
