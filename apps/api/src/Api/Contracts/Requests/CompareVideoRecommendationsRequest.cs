using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TijarahJo.Api.Contracts.Requests;

public sealed class CompareVideoRecommendationsRequest
{
    [Required]
    [MinLength(1)]
    [MaxLength(3)]
    public List<int> PostIds { get; init; } = [];

    [MaxLength(5)]
    public string Language { get; init; } = "en";
}
