using System.ComponentModel.DataAnnotations;

namespace TijarahJoDBAPI.Contracts.Requests;

public sealed class CreateReviewRequest
{
    [Range(1, int.MaxValue)]
    public int ReviewedUserID { get; set; }

    [Range(1, 5)]
    public int Rating { get; set; }

    [Required]
    [MaxLength(2000)]
    public string Comment { get; set; } = string.Empty;
}
