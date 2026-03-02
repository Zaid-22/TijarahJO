using System.ComponentModel.DataAnnotations;

namespace TijarahJoDBAPI.Contracts.Requests;

public sealed class ConfirmPasswordResetRequest
{
    [Required(AllowEmptyStrings = false)]
    [StringLength(255)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required(AllowEmptyStrings = false)]
    [StringLength(10, MinimumLength = 4)]
    public string Code { get; set; } = string.Empty;

    [Required(AllowEmptyStrings = false)]
    [StringLength(200, MinimumLength = 8)]
    public string NewPassword { get; set; } = string.Empty;
}
