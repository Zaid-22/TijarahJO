using System.ComponentModel.DataAnnotations;

namespace TijarahJoDBAPI.Contracts.Requests;

public sealed class UpdateRoleRequest
{
    [Required]
    [MaxLength(50)]
    public string RoleName { get; set; } = string.Empty;
}
