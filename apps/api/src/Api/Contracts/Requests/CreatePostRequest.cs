using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TijarahJoDBAPI.Contracts.Requests;

public sealed class CreatePostRequest
{
    [Range(1, int.MaxValue)]
    public int CategoryID { get; set; }

    [Required]
    [MaxLength(200)]
    public string PostTitle { get; set; } = string.Empty;

    [MaxLength(10000)]
    public string? PostDescription { get; set; }

    [Range(typeof(decimal), "0", "79228162514264337593543950335")]
    public decimal? Price { get; set; }

    public int? CityId { get; set; }
    public int? AreaId { get; set; }

    public List<string>? Images { get; set; }
}
