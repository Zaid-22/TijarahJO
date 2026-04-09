using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TijarahJo.Api.Contracts.Requests;

public sealed class CompareRequest
{
    [Required]
    [MinLength(2, ErrorMessage = "At least 2 products are required for comparison.")]
    [MaxLength(3, ErrorMessage = "At most 3 products can be compared at a time.")]
    public List<int> ProductIds { get; set; } = [];
}
