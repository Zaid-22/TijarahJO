namespace TijarahJoDBAPI.Common.Services;

/// <summary>
/// Abstraction for JWT token generation — enables mocking in tests.
/// </summary>
public interface ITokenService
{
    string GenerateToken(int userId, string email, string roleName);
}
