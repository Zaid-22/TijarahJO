using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using TijarahJo.Api.Common.Authorization;
using TijarahJo.Api.Common.Configuration;

namespace TijarahJo.Api.Startup;

public static class AuthenticationExtensions
{
    private static Action<AuthorizationPolicyBuilder> RequireAdminAccess()
        => policy =>
        {
            policy.RequireAuthenticatedUser();
            policy.RequireAssertion(context => AuthorizationPrincipalHelpers.HasAdminAccess(context.User));
        };

    private static Action<AuthorizationPolicyBuilder> RequirePermission(string permissionKey)
        => policy =>
        {
            policy.RequireAuthenticatedUser();
            policy.RequireAssertion(context => AuthorizationPrincipalHelpers.HasPermission(context.User, permissionKey));
        };

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
                ClockSkew = TimeSpan.FromSeconds(30), // Small tolerance for clock drift between servers
                NameClaimType = ClaimTypes.NameIdentifier,
                RoleClaimType = ClaimTypes.Role,
            };

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

        services.AddTransient<IClaimsTransformation, PermissionClaimsTransformation>();

        services.AddAuthorizationBuilder()
            .AddPolicy(AuthorizationPolicies.AdminOnly, policy =>
            {
                policy.RequireAuthenticatedUser();
                policy.RequireAssertion(context =>
                    AuthorizationPrincipalHelpers.IsAdminRole(context.User));
            })
            .AddPolicy(AuthorizationPolicies.AdminAccess, RequireAdminAccess())
            .AddPolicy(AuthorizationPolicies.UsersView, RequirePermission(PermissionKeys.UsersView))
            .AddPolicy(AuthorizationPolicies.UsersManage, RequirePermission(PermissionKeys.UsersManage))
            .AddPolicy(AuthorizationPolicies.PostsView, RequirePermission(PermissionKeys.PostsView))
            .AddPolicy(AuthorizationPolicies.PostsModerate, RequirePermission(PermissionKeys.PostsModerate))
            .AddPolicy(AuthorizationPolicies.CommentsView, RequirePermission(PermissionKeys.CommentsView))
            .AddPolicy(AuthorizationPolicies.CommentsModerate, RequirePermission(PermissionKeys.CommentsModerate))
            .AddPolicy(AuthorizationPolicies.ReviewsView, RequirePermission(PermissionKeys.ReviewsView))
            .AddPolicy(AuthorizationPolicies.ReviewsModerate, RequirePermission(PermissionKeys.ReviewsModerate))
            .AddPolicy(AuthorizationPolicies.ReportsView, RequirePermission(PermissionKeys.ReportsView))
            .AddPolicy(AuthorizationPolicies.ReportsResolve, RequirePermission(PermissionKeys.ReportsResolve))
            .AddPolicy(AuthorizationPolicies.LocationsManage, RequirePermission(PermissionKeys.LocationsManage))
            .AddPolicy(AuthorizationPolicies.BannersManage, RequirePermission(PermissionKeys.BannersManage))
            .AddPolicy(AuthorizationPolicies.SettingsManage, RequirePermission(PermissionKeys.SettingsManage))
            .AddPolicy(AuthorizationPolicies.AuditView, RequirePermission(PermissionKeys.AuditView))
            .AddPolicy(AuthorizationPolicies.RolesManage, RequirePermission(PermissionKeys.RolesManage))
            .AddPolicy(AuthorizationPolicies.CategoriesManage, RequirePermission(PermissionKeys.CategoriesManage));

        return services;
    }
}
