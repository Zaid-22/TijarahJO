using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Net.Http.Headers;
using TijarahJoDBAPI.Common.Services;

namespace TijarahJoDBAPI.Startup;

/// <summary>
/// Intercepts authenticated requests and verifies that the provided JWT is not blacklisted.
/// This middleware must be added to the pipeline between UseAuthentication and UseAuthorization.
/// </summary>
public sealed class TokenBlacklistMiddleware
{
    private readonly RequestDelegate _next;

    public TokenBlacklistMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ITokenBlacklistService tokenBlacklistService)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            string? jti = context.User.FindFirstValue(JwtRegisteredClaimNames.Jti);
            
            if (!string.IsNullOrWhiteSpace(jti))
            {
                bool isBlacklisted = await tokenBlacklistService.IsBlacklistedAsync(jti, context.RequestAborted);
                if (isBlacklisted)
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync("{\"error\":\"Token is expired or invalidated.\"}");
                    return;
                }
            }
        }

        await _next(context);
    }
}
