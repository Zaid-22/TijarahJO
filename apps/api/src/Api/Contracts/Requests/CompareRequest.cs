using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TijarahJo.Api.Contracts.Requests;

public sealed class CompareRequest
{
    [Required]
    [MinLength(2, ErrorMessage = "At least 2 posts are required for comparison.")]
    [MaxLength(3, ErrorMessage = "At most 3 posts can be compared at a time.")]
    public List<int> PostIds { get; set; } = [];

    /// <summary>
    /// Language code for AI response: "en" (default) or "ar" for Arabic.
    /// </summary>
    public string Language { get; set; } = "en";
}
