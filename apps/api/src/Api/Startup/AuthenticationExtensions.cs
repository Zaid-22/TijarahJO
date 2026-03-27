using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using TijarahJo.Api.Common.Authorization;
using TijarahJo.Api.Common.Configuration;

namespace TijarahJo.Api.Startup;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddTijarahJoAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var jwtSection = configuration.GetSection("JWT");

        // Resolve values prioritizing environment variables over (potentially empty) appsettings.json values
        string? signingKey = Environment.GetEnvironmentVariable("JWT_SIGNING_KEY");
        if (string.IsNullOrEmpty(signingKey)) signingKey = jwtSection["SigningKey"];
        signingKey ??= "";

        string? issuer = Environment.GetEnvironmentVariable("JWT_ISSUER");
        if (string.IsNullOrEmpty(issuer)) issuer = jwtSection["Issuer"];
        issuer ??= "";

        string? audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE");
        if (string.IsNullOrEmpty(audience)) audience = jwtSection["Audience"];
        audience ??= "";

        int lifetime = int.TryParse(jwtSection["Lifetime"], out int lt) ? lt : 120;

        // Validate SigningKey is not empty
        if (string.IsNullOrEmpty(signingKey))
        {
            throw new InvalidOperationException("JWT SigningKey is not configured. Set it in appsettings.json or JWT_SIGNING_KEY environment variable.");
        }

        const int minimumJwtSigningKeyBytes = 32;
        int signingKeyBytes = Encoding.UTF8.GetByteCount(signingKey);
        if (signingKeyBytes < minimumJwtSigningKeyBytes)
        {
            throw new InvalidOperationException(
                $"JWT SigningKey is too short. It must be at least {minimumJwtSigningKeyBytes} bytes (current: {signingKeyBytes})."
            );
        }

        // Fail fast if Issuer or Audience is not set in production
        var environment = configuration["ASPNETCORE_ENVIRONMENT"]
            ?? Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
            ?? "Production";
        bool isProduction = !string.Equals(environment, "Development", StringComparison.OrdinalIgnoreCase);

        if (isProduction && string.IsNullOrEmpty(issuer))
        {
            throw new InvalidOperationException("JWT Issuer must be configured for non-development environments.");
        }

        if (isProduction && string.IsNullOrEmpty(audience))
        {
            throw new InvalidOperationException("JWT Audience must be configured for non-development environments.");
        }

        // Construct immutable JwtOptions
        var jwtOptions = new JwtOptions
        {
            Issuer = issuer,
            Audience = audience,
            Lifetime = lifetime,
            SigningKey = signingKey
        };

        // Register JWT Options as singleton
        services.AddSingleton(jwtOptions);

        // Configure JWT Authentication
        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
        {
            options.SaveToken = true;

            options.TokenValidationParameters = new TokenValidationParameters()
            {
                ValidateIssuer = true,
                ValidIssuer = jwtOptions.Issuer,

                ValidateAudience = true,
                ValidAudience = jwtOptions.Audience,

                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey)),

                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromSeconds(30) // Small tolerance for clock drift between servers
            };

            options.Events = new JwtBearerEvents
            {
                OnTokenValidated = async context =>
                {
                    var blacklistService = context.HttpContext.RequestServices.GetRequiredService<TijarahJo.Application.Abstractions.Services.ITokenBlacklistService>();
                    var principal = context.Principal;
                    if (principal == null) return;

                    string? jti = principal.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Jti)?.Value;
                    if (!string.IsNullOrEmpty(jti) && await blacklistService.IsBlacklistedAsync(jti, context.HttpContext.RequestAborted))
                    {
                        context.Fail("Token is blacklisted.");
                        return;
                    }

                    string? userIdClaim = principal.FindFirst("userId")?.Value ?? principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                    if (int.TryParse(userIdClaim, out int userId))
                    {
                        string? iatClaim = principal.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Iat)?.Value;
                        if (long.TryParse(iatClaim, out long iatUnix))
                        {
                            var iat = DateTimeOffset.FromUnixTimeSeconds(iatUnix);
                            if (await blacklistService.IsUserSessionInvalidatedAsync(userId, iat, context.HttpContext.RequestAborted))
                            {
                                context.Fail("User session was invalidated.");
                                return;
                            }
                        }
                    }
                },
                OnMessageReceived = context =>
                {
                    if (string.IsNullOrWhiteSpace(context.Token))
                    {
                        var cookieToken = context.Request.Cookies["jwt"];
                        if (!string.IsNullOrWhiteSpace(cookieToken))
                        {
                            context.Token = cookieToken;
                        }
                    }
                    return Task.CompletedTask;
                }
            };
        });

        services.AddAuthorizationBuilder()
            .AddPolicy(AuthorizationPolicies.AdminOnly, policy =>
            {
                policy.RequireAuthenticatedUser();
                policy.RequireRole(AppRoles.Admin);
            });

        return services;
    }
}
