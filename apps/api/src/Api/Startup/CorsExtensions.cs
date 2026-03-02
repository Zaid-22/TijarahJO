using System.Net;

namespace TijarahJoDBAPI.Startup;

public static class CorsExtensions
{
    public static IServiceCollection AddTijarahJoCors(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        services.AddCors(options =>
        {
            if (environment.IsDevelopment())
            {
                options.AddPolicy("AllowAll",
                    policy =>
                    {
                        policy
                            .SetIsOriginAllowed(origin =>
                            {
                                if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                                {
                                    return false;
                                }

                                bool isLocalHost =
                                    uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
                                    uri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase);
                                bool isHttp = uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps;

                                return isLocalHost && isHttp;
                            })
                            .AllowAnyMethod()
                            .AllowAnyHeader()
                            .AllowCredentials();
                    });
            }
            else
            {
                var allowedOrigins = configuration["CORS:AllowedOrigins"]?
                        .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    ?? Array.Empty<string>();

                if (allowedOrigins.Length == 0)
                {
                    string? frontendUrl = configuration["FrontendUrl"]?.Trim();
                    if (!string.IsNullOrWhiteSpace(frontendUrl))
                    {
                        allowedOrigins = new[] { frontendUrl };
                    }
                }

                if (allowedOrigins.Length == 0)
                {
                    throw new InvalidOperationException(
                        "CORS allowed origins are not configured for production. Set CORS:AllowedOrigins or FrontendUrl."
                    );
                }

                foreach (string origin in allowedOrigins)
                {
                    if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri) ||
                        (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
                    {
                        throw new InvalidOperationException($"Invalid CORS origin configured: '{origin}'.");
                    }
                }

                options.AddPolicy("AllowAll",
                    policy =>
                    {
                        policy
                            .WithOrigins(allowedOrigins)
                            .AllowAnyMethod()
                            .AllowAnyHeader()
                            .AllowCredentials();
                    });
            }
        });

        return services;
    }
}
