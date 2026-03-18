using System.ComponentModel.DataAnnotations;

namespace TijarahJo.Api.Contracts.Requests;

public sealed class CreateRoleRequest
{
    [Required]
    [MaxLength(50)]
    public string RoleName { get; set; } = string.Empty;
}
