using System.ComponentModel.DataAnnotations;

namespace TijarahJoDBAPI.Contracts.Requests;

public sealed class ForgotPasswordRequest
{
    [Required(AllowEmptyStrings = false)]
    [StringLength(255)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}
