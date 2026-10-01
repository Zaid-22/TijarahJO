namespace TijarahJo.Api.Contracts.Responses;

public class UserResponseDTO
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    /// <summary>FK into dbo.Cities. Null if location not set. Use GET /api/cities to resolve to name.</summary>
    public int? CityId { get; set; }
    /// <summary>FK into dbo.Areas. Null if area not set.</summary>
    public int? AreaId { get; set; }
    public string? Bio { get; set; }
    public string? Avatar { get; set; }
    public DateTime JoinedDate { get; set; }
    public int Status { get; set; }
    public DateTime? SuspendedUntil { get; set; }
    public int RoleID { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public bool HasAdminAccess { get; set; }
    public IReadOnlyList<string> AdminPermissions { get; set; } = [];
    public bool IsEmailVerified { get; set; }
}
