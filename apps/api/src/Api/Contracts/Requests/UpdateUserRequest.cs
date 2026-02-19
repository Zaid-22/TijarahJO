namespace TijarahJoDBAPI.Contracts.Requests;

public class UpdateUserRequest
{
    public string? Password { get; set; }
    public string? Email { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Phone { get; set; }
    public string? City { get; set; }
    public string? Area { get; set; }
    public string? Bio { get; set; }
    public string? Avatar { get; set; }
    public int? Status { get; set; }
    public int? RoleID { get; set; }
    public bool? IsDeleted { get; set; }
}
