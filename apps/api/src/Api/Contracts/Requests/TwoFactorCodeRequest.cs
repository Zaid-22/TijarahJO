using System.ComponentModel.DataAnnotations;

namespace TijarahJoDBAPI.Contracts.Requests;

public sealed class TwoFactorCodeRequest
{
    [Required(AllowEmptyStrings = false)]
    [StringLength(16, MinimumLength = 6)]
    public string Code { get; set; } = string.Empty;
}
