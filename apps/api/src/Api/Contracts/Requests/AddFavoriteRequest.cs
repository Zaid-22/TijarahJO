using System.ComponentModel.DataAnnotations;

namespace TijarahJo.Api.Contracts.Requests;

public sealed class AddFavoriteRequest
{
    [Required(AllowEmptyStrings = false)]
    [MaxLength(20)]
    public string PostId { get; set; } = string.Empty;
}
