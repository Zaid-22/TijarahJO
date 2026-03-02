using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using TijarahJoDBAPI.Common.Authorization;
using TijarahJoDBAPI.Common.Configuration;

namespace TijarahJoDBAPI.Startup;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddTijarahJoAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Configure JWT Options from appsettings with environment variable override
        var jwtOptions = configuration.GetSection("JWT").Get<JwtOptions>();
        if (jwtOptions == null)
        {
            throw new InvalidOperationException("JWT configuration is missing from appsettings.json");
        }

        // Override SigningKey from environment variable if present (production)
        var signingKeyFromEnv = configuration["JWT:SigningKey"] ?? Environment.GetEnvironmentVariable("JWT_SIGNING_KEY");
        if (!string.IsNullOrEmpty(signingKeyFromEnv))
        {
            jwtOptions.SigningKey = signingKeyFromEnv;
        }

        // Validate SigningKey is not empty
        if (string.IsNullOrEmpty(jwtOptions.SigningKey))
        {
            throw new InvalidOperationException("JWT SigningKey is not configured. Set it in appsettings.json or JWT_SIGNING_KEY environment variable.");
        }

        const int minimumJwtSigningKeyBytes = 32;
        int signingKeyBytes = Encoding.UTF8.GetByteCount(jwtOptions.SigningKey);
        if (signingKeyBytes < minimumJwtSigningKeyBytes)
        {
            throw new InvalidOperationException(
                $"JWT SigningKey is too short. It must be at least {minimumJwtSigningKeyBytes} bytes (current: {signingKeyBytes})."
            );
        }

        // Override Issuer/Audience from environment variables if present
        jwtOptions.Issuer = configuration["JWT:Issuer"] ?? Environment.GetEnvironmentVariable("JWT_ISSUER") ?? jwtOptions.Issuer;
        jwtOptions.Audience = configuration["JWT:Audience"] ?? Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? jwtOptions.Audience;

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

            // Cookie-first auth support for API calls and SignalR.
            options.Events = new JwtBearerEvents
            {
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

        services.AddAuthorization(options =>
        {
            options.AddPolicy(AuthorizationPolicies.AdminOnly, policy =>
            {
                policy.RequireAuthenticatedUser();
                policy.RequireRole(AppRoles.Admin);
            });
        });

        return services;
    }
}
