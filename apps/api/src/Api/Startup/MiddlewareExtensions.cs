using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using System.Text.Json;

namespace TijarahJo.Api.Startup;

public static class MiddlewareExtensions
{
    public static WebApplication UseTijarahJoExceptionHandler(this WebApplication app)
    {
        app.UseExceptionHandler(errorApp =>
        {
            errorApp.Run(async context =>
            {
                var loggerFactory = context.RequestServices.GetRequiredService<ILoggerFactory>();
                var logger = loggerFactory.CreateLogger("GlobalExceptionHandler");
                var exceptionFeature = context.Features.Get<IExceptionHandlerPathFeature>();
                bool isDevelopment = app.Environment.IsDevelopment();

                if (exceptionFeature?.Error != null)
                {
                    logger.LogError(
                        exceptionFeature.Error,
                        "Unhandled exception while processing {Path}",
                        exceptionFeature.Path
                    );
                }

                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                context.Response.ContentType = "application/problem+json";
                var problem = new ProblemDetails
                {
                    Status = StatusCodes.Status500InternalServerError,
                    Title = ReasonPhrases.GetReasonPhrase(StatusCodes.Status500InternalServerError),
                    Detail = isDevelopment ? exceptionFeature?.Error?.Message : "An internal server error occurred.",
                    Type = "https://httpstatuses.com/500",
                    Instance = exceptionFeature?.Path ?? context.Request.Path
                };
                problem.Extensions["traceId"] = context.TraceIdentifier;

                await context.Response.WriteAsJsonAsync(problem);
            });
        });

        return app;
    }

    public static WebApplication UseTijarahJoTokenBlacklist(this WebApplication app)
    {
        app.UseMiddleware<TokenBlacklistMiddleware>();
        return app;
    }

    public static WebApplication UseTijarahJoCsrfMiddleware(this WebApplication app)
    {
        app.Use(async (context, next) =>
        {
            static bool IsSafeMethod(string method) =>
                HttpMethods.IsGet(method) ||
                HttpMethods.IsHead(method) ||
                HttpMethods.IsOptions(method) ||
                HttpMethods.IsTrace(method);

            bool isApiRequest = context.Request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase);
            if (!isApiRequest)
            {
                await next();
                return;
            }

            // Keep XSRF request token cookie current for browser clients using cookie auth.
            if (HttpMethods.IsGet(context.Request.Method) && context.Request.Cookies.ContainsKey("jwt"))
            {
                var antiforgery = context.RequestServices.GetRequiredService<IAntiforgery>();
                var tokens = antiforgery.GetAndStoreTokens(context);
                if (!string.IsNullOrWhiteSpace(tokens.RequestToken))
                {
                    bool isHttpsRequest = context.Request.IsHttps;
                    context.Response.Cookies.Append("XSRF-TOKEN", tokens.RequestToken!, new CookieOptions
                    {
                        HttpOnly = false,
                        Secure = isHttpsRequest,
                        SameSite = isHttpsRequest ? SameSiteMode.None : SameSiteMode.Lax,
                        Path = "/"
                    });
                }
            }

            if (IsSafeMethod(context.Request.Method))
            {
                await next();
                return;
            }

            Endpoint? endpoint = context.GetEndpoint();

            // Skip CSRF checks for anonymous endpoints.
            if (endpoint?.Metadata.GetMetadata<IAllowAnonymous>() != null)
            {
                await next();
                return;
            }

            // Only enforce CSRF for endpoints that actually require authorization.
            bool requiresAuthorization = endpoint?.Metadata.GetOrderedMetadata<IAuthorizeData>().Any() == true;
            if (!requiresAuthorization)
            {
                await next();
                return;
            }

            bool hasJwtCookie = context.Request.Cookies.ContainsKey("jwt");
            string authorizationHeader = context.Request.Headers.Authorization.ToString();
            bool hasBearerHeader =
                !string.IsNullOrWhiteSpace(authorizationHeader) &&
                authorizationHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase);

            // Enforce CSRF only for cookie-authenticated unsafe requests on authorized endpoints.
            if (hasJwtCookie && !hasBearerHeader)
            {
                var antiforgery = context.RequestServices.GetRequiredService<IAntiforgery>();
                var loggerFactory = context.RequestServices.GetRequiredService<ILoggerFactory>();
                var logger = loggerFactory.CreateLogger("CsrfMiddleware");
                try
                {
                    await antiforgery.ValidateRequestAsync(context);
                }
                catch (AntiforgeryValidationException ex)
                {
                    logger.LogWarning(ex, "CSRF validation failed for {Method} {Path}", context.Request.Method, context.Request.Path);
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    context.Response.ContentType = "application/problem+json";
                    var problem = new ProblemDetails
                    {
                        Status = StatusCodes.Status403Forbidden,
                        Title = ReasonPhrases.GetReasonPhrase(StatusCodes.Status403Forbidden),
                        Detail = "CSRF validation failed.",
                        Type = "https://httpstatuses.com/403",
                        Instance = context.Request.Path
                    };
                    problem.Extensions["traceId"] = context.TraceIdentifier;
                    await context.Response.WriteAsJsonAsync(problem);
                    return;
                }
            }

            await next();
        });

        return app;
    }

    public static WebApplication UseTijarahJoStatusCodePages(this WebApplication app)
    {
        app.UseStatusCodePages(async statusCodeContext =>
        {
            HttpContext httpContext = statusCodeContext.HttpContext;
            HttpResponse response = httpContext.Response;
            if (response.HasStarted || response.StatusCode < 400)
            {
                return;
            }

            if (response.ContentLength.HasValue && response.ContentLength.Value > 0)
            {
                return;
            }

            var problem = new ProblemDetails
            {
                Status = response.StatusCode,
                Title = ReasonPhrases.GetReasonPhrase(response.StatusCode),
                Type = $"https://httpstatuses.com/{response.StatusCode}",
                Instance = httpContext.Request.Path
            };
            problem.Extensions["traceId"] = httpContext.TraceIdentifier;

            response.ContentType = "application/problem+json";
            await response.WriteAsJsonAsync(problem);
        });

        return app;
    }
}
