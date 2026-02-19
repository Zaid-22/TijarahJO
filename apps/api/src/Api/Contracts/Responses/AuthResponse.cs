using Models;

namespace TijarahJoDBAPI.Contracts.Responses;

public class AuthResponse
{
    public bool Success { get; set; }
    public string? Token { get; set; }
    public UserResponseDTO? User { get; set; }
    public string? Message { get; set; }
}

