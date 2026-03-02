using System.ComponentModel.DataAnnotations;

namespace TijarahJoDBAPI.Contracts.Requests;

public sealed class VerifyTwoFactorLoginRequest
{
    [Required(AllowEmptyStrings = false)]
    [StringLength(4000)]
    public string TwoFactorToken { get; set; } = string.Empty;

    [Required(AllowEmptyStrings = false)]
    [StringLength(16, MinimumLength = 6)]
    public string Code { get; set; } = string.Empty;
}
