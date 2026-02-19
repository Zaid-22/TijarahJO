namespace TijarahJoDBAPI.Contracts.Requests;

public class SignUpRequest
{
    public string? Email { get; set; }
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Phone { get; set; }

    public string? City { get; set; }
    public string? Area { get; set; }
    public string? Bio { get; set; }
    public string? Avatar { get; set; }
}
