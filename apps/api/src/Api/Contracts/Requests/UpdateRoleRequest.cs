using System.ComponentModel.DataAnnotations;

namespace TijarahJo.Api.Contracts.Requests;

public sealed class UpdateRoleRequest
{
    [Required]
    [MaxLength(50)]
    public string RoleName { get; set; } = string.Empty;
}
