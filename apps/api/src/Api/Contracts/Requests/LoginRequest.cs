namespace TijarahJoDBAPI.Contracts.Requests;

public class LoginRequest
{
    public string Login { get; set; } = string.Empty; // Can be email or phone
    public string Password { get; set; } = string.Empty;
}
