using System.ComponentModel.DataAnnotations;

namespace TijarahJo.Api.Contracts.Requests;

public sealed class VerifyPasswordResetCodeRequest
{
    [Required(AllowEmptyStrings = false)]
    [StringLength(255)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required(AllowEmptyStrings = false)]
    [StringLength(10, MinimumLength = 4)]
    public string Code { get; set; } = string.Empty;
}
