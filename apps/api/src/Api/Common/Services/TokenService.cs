using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using TijarahJoDBAPI.Common.Authorization;
using TijarahJoDBAPI.Common.Configuration;

namespace TijarahJoDBAPI.Common.Services;

/// <summary>
/// Service for generating and validating JWT tokens
/// </summary>
public class TokenService
{
    private readonly JwtOptions _jwtOptions;

    public TokenService(JwtOptions jwtOptions)
    {
        _jwtOptions = jwtOptions;
    }

    /// <summary>
    /// Generate JWT token for a user
    /// </summary>
    public string GenerateToken(int userId, string email, string roleName)
    {
        string normalizedRoleName = AppRoles.NormalizeRoleName(roleName);
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Email, email),
            new Claim(ClaimTypes.Role, normalizedRoleName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.SigningKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwtOptions.Issuer,
            audience: _jwtOptions.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwtOptions.Lifetime),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

}
