using System.ComponentModel.DataAnnotations;

namespace TijarahJoDBAPI.Contracts.Requests;

public sealed class CreateRoleRequest
{
    [Required]
    [MaxLength(50)]
    public string RoleName { get; set; } = string.Empty;
}
