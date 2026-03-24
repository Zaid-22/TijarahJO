using System.Security.Cryptography;
using System.Text;
using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Common;
using TijarahJo.Api.Common.Services;
using TijarahJo.Api.Common.Utils;
using TijarahJo.Api.Contracts.Responses;

namespace TijarahJo.Api.Features.Auth;

/// <summary>
/// Shared helpers used across AuthController, TwoFactorController, and OAuthController.
/// Avoids duplicating cookie logic, token creation, and user-validation checks.
/// </summary>
internal static class AuthShared
{
    public static bool IsActiveUser(UserModel? user)
    {
        return user != null &&
               user.UserID.HasValue &&
               !user.IsDeleted &&
               user.Status == UserStatusPolicy.Active;
    }

    public static async Task<string?> ResolveRoleNameForTokenAsync(
        IRoleService roles, int roleId, CancellationToken cancellationToken)
    {
        Role? role = await roles.FindAsync(roleId, cancellationToken);
        if (role == null || role.IsDeleted || string.IsNullOrWhiteSpace(role.RoleName))
        {
            return null;
        }

        return role.RoleName.Trim();
    }

    public static AuthResponse CreateAuthenticatedResponse(
        ITokenService tokenService,
        HttpResponse httpResponse,
        UserModel user,
        string roleName)
    {
        string token = tokenService.GenerateToken(user.UserID!.Value, user.Email, roleName);
        SetTokenCookie(httpResponse, token);

        return new AuthResponse
        {
            Success = true,
            Token = token,
            User = DTOMapper.ToUserResponseDTO(user, roleName)
        };
    }

    public static AuthResponse BuildTwoFactorChallengeResponse(
        TwoFactorService twoFactorService, int userId)
    {
        string challengeToken = twoFactorService.IssueLoginChallengeToken(userId, DateTimeOffset.UtcNow);
        return new AuthResponse
        {
            Success = true,
            RequiresTwoFactor = true,
            TwoFactorToken = challengeToken,
            Message = "Two-factor verification is required."
        };
    }

    public static void SetTokenCookie(HttpResponse response, string token)
    {
        bool isHttpsRequest = response.HttpContext.Request.IsHttps;
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Expires = DateTime.UtcNow.AddDays(7),
            Secure = isHttpsRequest,
            SameSite = isHttpsRequest ? SameSiteMode.None : SameSiteMode.Lax,
            Path = "/"
        };
        response.Cookies.Append("jwt", token, cookieOptions);
    }

    public static void SetShortLivedAuthCookie(HttpResponse response, string name, string value, TimeSpan lifetime)
    {
        bool isHttpsRequest = response.HttpContext.Request.IsHttps;
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Expires = DateTime.UtcNow.Add(lifetime),
            Secure = isHttpsRequest,
            SameSite = SameSiteMode.Lax,
            IsEssential = true,
            Path = "/"
        };
        response.Cookies.Append(name, value, cookieOptions);
    }

    public static void DeleteCookie(HttpResponse response, string name)
    {
        response.Cookies.Delete(name, new CookieOptions { Path = "/" });
    }

    public static bool FixedTimeEquals(string left, string right)
    {
        if (string.IsNullOrWhiteSpace(left) || string.IsNullOrWhiteSpace(right))
        {
            return false;
        }

        byte[] leftBytes = Encoding.UTF8.GetBytes(left);
        byte[] rightBytes = Encoding.UTF8.GetBytes(right);
        if (leftBytes.Length != rightBytes.Length)
        {
            return false;
        }

        return CryptographicOperations.FixedTimeEquals(leftBytes, rightBytes);
    }
}
