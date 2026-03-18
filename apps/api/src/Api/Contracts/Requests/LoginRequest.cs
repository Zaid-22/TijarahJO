using System.ComponentModel.DataAnnotations;

namespace TijarahJo.Api.Contracts.Requests;

public class LoginRequest
{
    [Required(AllowEmptyStrings = false)]
    [StringLength(255)]
    public string Login { get; set; } = string.Empty; // Can be email or phone

    [Required(AllowEmptyStrings = false)]
    [StringLength(200, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;
}
