using System.ComponentModel.DataAnnotations;

namespace TijarahJo.Api.Contracts.Requests;

public class ResendVerificationEmailRequest
{
    [Required(AllowEmptyStrings = false)]
    [StringLength(255)]
    public string Email { get; set; } = string.Empty;
}
