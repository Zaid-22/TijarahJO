using System.ComponentModel.DataAnnotations;

namespace TijarahJo.Api.Contracts.Requests;

public class UpdateUserRequest
{
    [StringLength(200, MinimumLength = 8)]
    public string? Password { get; set; }

    [EmailAddress]
    [StringLength(255)]
    public string? Email { get; set; }

    [StringLength(100)]
    public string? FirstName { get; set; }

    [StringLength(100)]
    public string? LastName { get; set; }

    [StringLength(20)]
    public string? Phone { get; set; }

    [Range(1, int.MaxValue)]
    public int? CityId { get; set; }

    [Range(1, int.MaxValue)]
    public int? AreaId { get; set; }

    [StringLength(1000)]
    public string? Bio { get; set; }

    public string? Avatar { get; set; }

    [Range(1, 3)]
    public int? Status { get; set; }

    [Range(1, int.MaxValue)]
    public int? RoleID { get; set; }

    public bool? IsDeleted { get; set; }
}
