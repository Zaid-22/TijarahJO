using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.Net.Http.Headers;
using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Api.Startup;

/// <summary>
/// Intercepts authenticated requests and verifies that the provided JWT is not blacklisted
/// or session-invalidated. Endpoints marked with [AllowAnonymous] are always passed through —
/// a stale or invalidated cookie must never block access to public resources.
/// This middleware must be added to the pipeline between UseAuthentication and UseAuthorization.
/// </summary>
public sealed class TokenBlacklistMiddleware(RequestDelegate next)
{

    public async Task InvokeAsync(HttpContext context, ITokenBlacklistService tokenBlacklistService)
    {
        // If the resolved endpoint explicitly allows anonymous access, skip all checks.
        // A stale/invalidated JWT cookie must never block a public endpoint — the same
        // principle the CSRF middleware follows. [AllowAnonymous] is an authorization
        // concern resolved at the endpoint level; middleware runs before UseAuthorization
        // and has no knowledge of it unless we check endpoint metadata explicitly.
        Endpoint? endpoint = context.GetEndpoint();
        bool isAnonymousEndpoint = endpoint?.Metadata.GetMetadata<IAllowAnonymous>() != null;
        if (isAnonymousEndpoint)
        {
            await next(context);
            return;
        }

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

            string? userIdStr = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            string? iatStr = context.User.FindFirstValue(JwtRegisteredClaimNames.Iat);

            if (int.TryParse(userIdStr, out int userId) && long.TryParse(iatStr, out long iatUnix))
            {
                var tokenIssuedAt = DateTimeOffset.FromUnixTimeSeconds(iatUnix);
                bool isSessionInvalidated = await tokenBlacklistService.IsUserSessionInvalidatedAsync(userId, tokenIssuedAt, context.RequestAborted);
                
                if (isSessionInvalidated)
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync("{\"error\":\"Session has been invalidated due to a password change.\"}");
                    return;
                }
            }
        }

        await next(context);
    }
}
