using System.ComponentModel.DataAnnotations;

namespace TijarahJo.Api.Contracts.Requests;

public class VerifyEmailRequest
{
    [Required(AllowEmptyStrings = false)]
    public string Token { get; set; } = string.Empty;
}
