using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Hosting;
using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Common;
using TijarahJo.Api.Common.Authorization;
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
        string roleName,
        UserPermissionSnapshot? permissionSnapshot = null)
    {
        string token = tokenService.GenerateToken(user.UserID!.Value, user.Email, roleName);
        SetTokenCookie(httpResponse, token);

        bool hasAdminAccess = permissionSnapshot?.HasAdminAccess
            ?? AppRoles.IsAdminRoleName(roleName);
        IReadOnlyList<string> adminPermissions = permissionSnapshot?.PermissionKeys ?? [];

        return new AuthResponse
        {
            Success = true,
            User = DTOMapper.ToUserResponseDTO(
                user,
                roleName,
                httpResponse.HttpContext.Request,
                hasAdminAccess,
                adminPermissions)
        };
    }

    public static AuthResponse BuildTwoFactorChallengeResponse(
        TwoFactorService twoFactorService,
        int userId,
        string? message = null)
    {
        string challengeToken = twoFactorService.IssueLoginChallengeToken(userId, DateTimeOffset.UtcNow);
        return new AuthResponse
        {
            Success = true,
            RequiresTwoFactor = true,
            TwoFactorToken = challengeToken,
            Message = string.IsNullOrWhiteSpace(message)
                ? "Two-factor verification is required."
                : message.Trim()
        };
    }

    public static void SetTokenCookie(HttpResponse response, string token)
    {
        var environment = response.HttpContext.RequestServices.GetRequiredService<IHostEnvironment>();
        var cookieOptions = BuildAuthCookieOptions(
            environment,
            response.HttpContext.Request,
            DateTime.UtcNow.AddDays(7),
            jwtCookie: true);
        response.Cookies.Append("jwt", token, cookieOptions);
    }

    public static void SetShortLivedAuthCookie(HttpResponse response, string name, string value, TimeSpan lifetime)
    {
        var environment = response.HttpContext.RequestServices.GetRequiredService<IHostEnvironment>();
        var cookieOptions = BuildAuthCookieOptions(
            environment,
            response.HttpContext.Request,
            DateTime.UtcNow.Add(lifetime),
            jwtCookie: false);
        response.Cookies.Append(name, value, cookieOptions);
    }

    private static CookieOptions BuildAuthCookieOptions(
        IHostEnvironment environment,
        HttpRequest request,
        DateTime expiresUtc,
        bool jwtCookie)
    {
        bool isDevelopment = environment.IsDevelopment();
        bool isHttpsRequest = request.IsHttps;

        // Security-sensitive cookie attributes should not rely solely on Request.IsHttps.
        // In non-development environments, force Secure cookies and cross-site compatibility
        // for JWT cookies even if a proxy misconfiguration causes IsHttps=false.
        bool secure = !isDevelopment || isHttpsRequest;
        SameSiteMode sameSite = jwtCookie
            ? (isDevelopment && !isHttpsRequest ? SameSiteMode.Lax : SameSiteMode.None)
            : SameSiteMode.Lax;

        return new CookieOptions
        {
            HttpOnly = true,
            Expires = expiresUtc,
            Secure = secure,
            SameSite = sameSite,
            IsEssential = true,
            Path = "/"
        };
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
