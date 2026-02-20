using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.HttpLogging;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Net;
using System.Text;
using System.Threading.RateLimiting;
using System.Threading.Tasks;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.Application.Services;
using TijarahJoDB.Bootstrap;
using TijarahJoDBAPI.Common.Authorization;
using TijarahJoDBAPI.Common.Filters;
using TijarahJoDBAPI.Common.Health;
using TijarahJoDBAPI.Common.Configuration;
using TijarahJoDBAPI.Common.Services;

var builder = WebApplication.CreateBuilder(args);

FeatureFlagsOptions featureFlags = builder.Configuration
    .GetSection("FeatureFlags")
    .Get<FeatureFlagsOptions>()
    ?? new FeatureFlagsOptions();
builder.Services.AddSingleton(featureFlags);
builder.Services.Configure<WebPushOptions>(builder.Configuration.GetSection("WebPush"));

string[] configuredKnownProxies = builder.Configuration
    .GetSection("ForwardedHeaders:KnownProxies")
    .Get<string[]>()
    ?? Array.Empty<string>();
string[] configuredKnownNetworks = builder.Configuration
    .GetSection("ForwardedHeaders:KnownNetworks")
    .Get<string[]>()
    ?? Array.Empty<string>();
bool hasExplicitForwardedHeaderTrust = configuredKnownProxies.Length > 0 || configuredKnownNetworks.Length > 0;

static bool TryParseKnownNetwork(string rawValue, out Microsoft.AspNetCore.HttpOverrides.IPNetwork network)
{
    network = default!;
    if (string.IsNullOrWhiteSpace(rawValue))
    {
        return false;
    }

    string[] segments = rawValue.Split('/', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
    if (segments.Length != 2 || !IPAddress.TryParse(segments[0], out IPAddress? address))
    {
        return false;
    }

    if (!int.TryParse(segments[1], out int prefixLength))
    {
        return false;
    }

    int maxPrefix = address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork ? 32 : 128;
    if (prefixLength < 0 || prefixLength > maxPrefix)
    {
        return false;
    }

    network = new Microsoft.AspNetCore.HttpOverrides.IPNetwork(address, prefixLength);
    return true;
}

// Configure JSON serialization to preserve PascalCase (matching frontend expectations)
builder.Services.AddScoped<ProblemDetailsResultFilter>();
builder.Services.AddControllers(options =>
{
    options.Filters.Add<ProblemDetailsResultFilter>();
}).AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = null; // Preserve PascalCase
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var problem = new ValidationProblemDetails(context.ModelState)
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Request validation failed.",
            Detail = "One or more validation errors occurred.",
            Type = "https://httpstatuses.com/400",
            Instance = context.HttpContext.Request.Path
        };
        problem.Extensions["traceId"] = context.HttpContext.TraceIdentifier;

        return new BadRequestObjectResult(problem)
        {
            ContentTypes = { "application/problem+json" }
        };
    };
});

builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-Token";
    options.Cookie.Name = "tj-csrf";
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
        ? CookieSecurePolicy.SameAsRequest
        : CookieSecurePolicy.Always;
    options.Cookie.SameSite = builder.Environment.IsDevelopment()
        ? SameSiteMode.Lax
        : SameSiteMode.None;
});

builder.Services.AddMemoryCache();

if (featureFlags.EnableHttpLogging)
{
    builder.Services.AddHttpLogging(options =>
    {
        options.LoggingFields =
            HttpLoggingFields.RequestMethod |
            HttpLoggingFields.RequestPath |
            HttpLoggingFields.ResponseStatusCode |
            HttpLoggingFields.Duration;
    });
}

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;

    if (!hasExplicitForwardedHeaderTrust)
    {
        // Keep framework defaults (loopback trust only) unless explicit trusted proxy/networks are configured.
        return;
    }

    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();

    foreach (string configuredProxy in configuredKnownProxies)
    {
        if (!IPAddress.TryParse(configuredProxy, out IPAddress? proxyAddress))
        {
            throw new InvalidOperationException(
                $"Invalid ForwardedHeaders:KnownProxies entry '{configuredProxy}'. Expected an IP address."
            );
        }

        options.KnownProxies.Add(proxyAddress);
    }

    foreach (string configuredNetwork in configuredKnownNetworks)
    {
        if (!TryParseKnownNetwork(configuredNetwork, out Microsoft.AspNetCore.HttpOverrides.IPNetwork network))
        {
            throw new InvalidOperationException(
                $"Invalid ForwardedHeaders:KnownNetworks entry '{configuredNetwork}'. Expected CIDR notation like '10.0.0.0/8'."
            );
        }

        options.KnownNetworks.Add(network);
    }
});

if (featureFlags.EnableHealthChecks)
{
    builder.Services.AddHealthChecks()
        .AddCheck<DatabaseConnectivityHealthCheck>("database_connectivity");
}

if (featureFlags.EnableRateLimiting)
{
    builder.Services.AddRateLimiter(options =>
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        {
            string partition = httpContext.User?.Identity?.Name
                ?? httpContext.Connection.RemoteIpAddress?.ToString()
                ?? "unknown";

            return RateLimitPartition.GetFixedWindowLimiter(partition, _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 120,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
        });
    });
}

// Configure JWT Options from appsettings with environment variable override
var jwtOptions = builder.Configuration.GetSection("JWT").Get<JwtOptions>();
if (jwtOptions == null)
{
    throw new InvalidOperationException("JWT configuration is missing from appsettings.json");
}

// Override SigningKey from environment variable if present (production)
var signingKeyFromEnv = builder.Configuration["JWT:SigningKey"] ?? Environment.GetEnvironmentVariable("JWT_SIGNING_KEY");
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
jwtOptions.Issuer = builder.Configuration["JWT:Issuer"] ?? Environment.GetEnvironmentVariable("JWT_ISSUER") ?? jwtOptions.Issuer;
jwtOptions.Audience = builder.Configuration["JWT:Audience"] ?? Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? jwtOptions.Audience;

// Register JWT Options as singleton
builder.Services.AddSingleton(jwtOptions);

// Register TokenService as scoped
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<PostsFeedService>();
builder.Services.AddTijarahJoInfrastructure();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IPostService, PostService>();
builder.Services.AddScoped<IPostStatusTransitionService, PostStatusTransitionService>();
builder.Services.AddScoped<IPostImageService, PostImageService>();
builder.Services.AddScoped<IPostImageCommandService, PostImageCommandService>();
builder.Services.AddScoped<IFavoriteService, FavoriteService>();
builder.Services.AddScoped<IFavoriteCommandService, FavoriteCommandService>();
builder.Services.AddScoped<IMessageService, MessageService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<IReviewSubmissionService, ReviewSubmissionService>();

// Configure Swagger with JWT support
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "TijarahJoDBAPI",
        Version = "v1",
        Description = "API documentation for TijarahJoDBAPI with JWT Authentication"
    });

    // Enable JWT authentication in Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter 'Bearer' followed by your JWT token. Example: Bearer eyJhbGciOiJIUzI1NiIs..."
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Configure JWT Authentication
builder.Services.AddAuthentication(options =>
{
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
       .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
       {
           /// <summary>
           /// Instructs the JWT Bearer authentication handler to store the raw bearer token (from
    /// <c>Authorization: Bearer &lt;token&gt;</c>) into the successful authentication result's
           /// <see cref="Microsoft.AspNetCore.Authentication.AuthenticationProperties"/> (typically as <c>access_token</c>).
           /// This does not change token validation or claims creation; it only makes the original token retrievable later
           /// in the same request pipeline (e.g., <c>HttpContext.GetTokenAsync("access_token")</c>).
           /// </summary>
           options.SaveToken = true; // Save token in AuthenticationProperties after a successful authorization
           
           options.TokenValidationParameters = new TokenValidationParameters()
           {
               ValidateIssuer = true,
        ValidIssuer = jwtOptions.Issuer,

               ValidateAudience = true,
        ValidAudience = jwtOptions.Audience,

               ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey)),

        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero // Remove default 5 minute clock skew
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

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AuthorizationPolicies.AdminOnly, policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireRole(AppRoles.Admin);
    });
});

// Configure CORS based on environment
builder.Services.AddCors(options =>
{
    if (builder.Environment.IsDevelopment())
    {
        options.AddPolicy("AllowAll",
            policy =>
            {
                policy
                    // Allow localhost/127.0.0.1 with any development port.
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
        // Production: require explicit allowed origins and validate them.
        var allowedOrigins = builder.Configuration["CORS:AllowedOrigins"]?
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            ?? Array.Empty<string>();

        if (allowedOrigins.Length == 0)
        {
            string? frontendUrl = builder.Configuration["FrontendUrl"]?.Trim();
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

// Register SignalR
builder.Services.AddSignalR();

var app = builder.Build();

bool shouldUseForwardedHeaders = app.Environment.IsDevelopment() || hasExplicitForwardedHeaderTrust;
if (shouldUseForwardedHeaders)
{
    app.UseForwardedHeaders();
}
else
{
    app.Logger.LogWarning(
        "Forwarded headers middleware is disabled. Configure ForwardedHeaders:KnownProxies or ForwardedHeaders:KnownNetworks for non-development environments behind a reverse proxy."
    );
}

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

if (featureFlags.EnableHttpLogging)
{
    app.UseHttpLogging();
}

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

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Only use HTTPS redirection if HTTPS is configured
// This prevents the warning when running with HTTP-only profile
var urls = Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? "";
if (urls.Contains("https", StringComparison.OrdinalIgnoreCase))
{
    app.UseHttpsRedirection();
}

// Done - CORS must be before UseAuthentication and UseAuthorization
app.UseCors("AllowAll");

if (featureFlags.EnableRateLimiting)
{
    app.UseRateLimiter();
}

app.UseAuthentication();

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

    // Skip CSRF checks for anonymous endpoints.
    if (context.GetEndpoint()?.Metadata.GetMetadata<IAllowAnonymous>() != null)
    {
        await next();
        return;
    }

    bool hasJwtCookie = context.Request.Cookies.ContainsKey("jwt");
    string authorizationHeader = context.Request.Headers.Authorization.ToString();
    bool hasBearerHeader =
        !string.IsNullOrWhiteSpace(authorizationHeader) &&
        authorizationHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase);

    // Enforce CSRF only for cookie-authenticated unsafe requests.
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

app.UseAuthorization();

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

app.MapControllers();
if (featureFlags.EnableHealthChecks)
{
    app.MapHealthChecks("/health/live");
    app.MapHealthChecks("/health/ready");
}
// Map ChatHub
app.MapHub<TijarahJoDBAPI.Hubs.ChatHub>("/chatHub");

app.Run();

public partial class Program;
