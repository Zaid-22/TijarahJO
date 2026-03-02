namespace TijarahJoDBAPI.Contracts.Responses;

public class RoleResponseDTO
{
    public int RoleID { get; set; }
    public string Id { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsDeleted { get; set; }
}
