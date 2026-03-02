using System.ComponentModel.DataAnnotations;

namespace TijarahJoDBAPI.Contracts.Requests;

public sealed class AddFavoriteRequest
{
    [Required(AllowEmptyStrings = false)]
    [MaxLength(20)]
    public string PostId { get; set; } = string.Empty;
}
