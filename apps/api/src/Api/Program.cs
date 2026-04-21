using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.HttpLogging;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Asp.Versioning;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using System.Net;
using System.Threading.RateLimiting;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Services;
using TijarahJo.Bootstrap;
using TijarahJo.Api.Common.Configuration;
using TijarahJo.Api.Common.Filters;
using TijarahJo.Api.Common.Health;
using TijarahJo.Api.Common.Services;
using TijarahJo.Api.Common.Utils;
using TijarahJo.Api.Startup;
using TijarahJo.Infrastructure.Services;

Console.WriteLine("--> STARTING PROGRAM.CS");
var builder = WebApplication.CreateBuilder(args);
Console.WriteLine("--> WebApplication.CreateBuilder FINISHED");


// ---------------------------------------------------------------------------
// Feature flags
// ---------------------------------------------------------------------------
FeatureFlagsOptions featureFlags = builder.Configuration
    .GetSection("FeatureFlags")
    .Get<FeatureFlagsOptions>()
    ?? new FeatureFlagsOptions();
builder.Services.AddSingleton(featureFlags);

// ---------------------------------------------------------------------------
// Options binding
// ---------------------------------------------------------------------------
builder.Services.Configure<GoogleAuthOptions>(builder.Configuration.GetSection("GoogleAuth"));
builder.Services.Configure<FileStorageOptions>(builder.Configuration.GetSection("FileStorage"));
builder.Services.Configure<PasswordResetOptions>(builder.Configuration.GetSection("PasswordReset"));
builder.Services.Configure<PasswordResetEmailOptions>(builder.Configuration.GetSection("PasswordResetEmail"));
builder.Services.Configure<TwoFactorOptions>(builder.Configuration.GetSection("TwoFactor"));
builder.Services.Configure<EmailTwoFactorOptions>(builder.Configuration.GetSection("EmailTwoFactor"));
builder.Services.Configure<GeminiSettings>(builder.Configuration.GetSection("Gemini"));
builder.Services.Configure<YouTubeSettings>(builder.Configuration.GetSection("YouTube"));
builder.Services.AddHttpClient<GoogleAuthService>();
builder.Services.AddHttpClient<IPostCompareService, GeminiPostCompareService>();
builder.Services.AddHttpClient<ICompareVideoRecommendationService, YouTubeCompareVideoRecommendationService>();

// ---------------------------------------------------------------------------
// Forwarded headers (proxy support)
// ---------------------------------------------------------------------------
string[] configuredKnownProxies = builder.Configuration
    .GetSection("ForwardedHeaders:KnownProxies")
    .Get<string[]>()
    ?? [];
string[] configuredKnownNetworks = builder.Configuration
    .GetSection("ForwardedHeaders:KnownNetworks")
    .Get<string[]>()
    ?? [];
bool hasExplicitForwardedHeaderTrust = configuredKnownProxies.Length > 0 || configuredKnownNetworks.Length > 0;

static bool TryParseKnownNetwork(string rawValue, out Microsoft.AspNetCore.HttpOverrides.IPNetwork network)
{
    network = default!;
    if (string.IsNullOrWhiteSpace(rawValue)) return false;
    string[] segments = rawValue.Split('/', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
    if (segments.Length != 2 || !IPAddress.TryParse(segments[0], out IPAddress? address)) return false;
    if (!int.TryParse(segments[1], out int prefixLength)) return false;
    int maxPrefix = address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork ? 32 : 128;
    if (prefixLength < 0 || prefixLength > maxPrefix) return false;
    network = new Microsoft.AspNetCore.HttpOverrides.IPNetwork(address, prefixLength);
    return true;
}

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    if (!hasExplicitForwardedHeaderTrust) return;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
    foreach (string proxy in configuredKnownProxies)
    {
        if (!IPAddress.TryParse(proxy, out IPAddress? addr))
            throw new InvalidOperationException($"Invalid ForwardedHeaders:KnownProxies entry '{proxy}'.");
        options.KnownProxies.Add(addr);
    }
    foreach (string net in configuredKnownNetworks)
    {
        if (!TryParseKnownNetwork(net, out var network))
            throw new InvalidOperationException($"Invalid ForwardedHeaders:KnownNetworks entry '{net}'.");
        options.KnownNetworks.Add(network);
    }
});

// ---------------------------------------------------------------------------
// MVC + JSON + API versioning + validation
// ---------------------------------------------------------------------------
builder.Services.AddScoped<ProblemDetailsResultFilter>();
builder.Services.AddControllers(options =>
{
    options.Filters.Add<ProblemDetailsResultFilter>();
}).AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = null; // Preserve PascalCase
});
builder.Services.AddEndpointsApiExplorer();
builder.Services
    .AddApiVersioning(options =>
    {
        options.DefaultApiVersion = new ApiVersion(1, 0);
        options.AssumeDefaultVersionWhenUnspecified = false;
        options.ReportApiVersions = true;
        options.ApiVersionReader = new UrlSegmentApiVersionReader();
    })
    .AddMvc()
    .AddApiExplorer(options =>
    {
        options.GroupNameFormat = "'v'VVV";
        options.SubstituteApiVersionInUrl = true;
    });
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

// ---------------------------------------------------------------------------
// Antiforgery (CSRF)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Caching
// ---------------------------------------------------------------------------
if (featureFlags.EnableInMemoryCaching)
    builder.Services.AddMemoryCache();
else
    builder.Services.AddSingleton<IMemoryCache, NoOpMemoryCache>();

// ---------------------------------------------------------------------------
// HTTP logging
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Health checks
// ---------------------------------------------------------------------------
if (featureFlags.EnableHealthChecks)
{
    builder.Services.AddHealthChecks()
        .AddCheck("process_liveness", () => HealthCheckResult.Healthy("Process is running."), tags: ["live"])
        .AddCheck<DatabaseConnectivityHealthCheck>("database_connectivity", tags: ["ready"]);
}

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------
// Keep production/staging protection on, but avoid throttling local dev and
// backend-connected browser E2E runs that legitimately issue many short-burst
// requests from a single loopback client.
bool enableRateLimiting = featureFlags.EnableRateLimiting && !builder.Environment.IsDevelopment();
if (enableRateLimiting)
{
    builder.Services.AddRateLimiter(options =>
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        {
            string partition = RateLimitPartitionResolver.Resolve(httpContext);
            return RateLimitPartition.GetFixedWindowLimiter(partition, _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 120,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
        });

        // Stricter rate limit for authentication endpoints (brute-force protection)
        options.AddPolicy("auth", httpContext =>
        {
            string partition = RateLimitPartitionResolver.Resolve(httpContext);
            return RateLimitPartition.GetFixedWindowLimiter($"auth:{partition}", _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 30,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
        });

        // AI comparison rate limit — admins are exempt for testing
        options.AddPolicy("compare", httpContext =>
        {
            // Exempt admin users from rate limiting
            if (ApiControllerHelpers.IsAdminUser(httpContext.User))
            {
                return RateLimitPartition.GetNoLimiter("admin:compare");
            }

            string partition = RateLimitPartitionResolver.Resolve(httpContext);
            return RateLimitPartition.GetFixedWindowLimiter($"compare:{partition}", _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
        });
    });
}

// ---------------------------------------------------------------------------
// Authentication, Authorization, CORS, Swagger, Redis (extracted extensions)
// ---------------------------------------------------------------------------
builder.Services.AddTijarahJoAuthentication(builder.Configuration);
builder.Services.AddTijarahJoCors(builder.Configuration, builder.Environment);
builder.Services.AddTijarahJoSwagger();

// API-layer services
builder.Services.AddScoped<ITokenService, TokenService>();
// Token blacklist is registered in InfrastructureServiceCollectionExtensions (DB-backed)
builder.Services.AddScoped<IPostsFeedService, PostsFeedService>();
builder.Services.AddScoped<IPasswordResetService, PasswordResetService>();
builder.Services.AddScoped<IPasswordResetEmailSender, PasswordResetEmailSender>();
builder.Services.AddScoped<IEmailTwoFactorSender, EmailTwoFactorSender>();
builder.Services.AddScoped<TwoFactorService>();
builder.Services.AddSingleton<IPostImageFileStorageService, LocalPostImageFileStorageService>();
builder.Services.AddSingleton<IImageModerationService, ImageModerationService>();
builder.Services.AddSingleton<InMemoryChatPresenceService>();

// Redis + SignalR
RedisStartupResult redisResult = await builder.Services.AddTijarahJoRedis(builder.Configuration, featureFlags);

// Infrastructure + Application layers (Bootstrap project)
builder.Services.AddTijarahJoInfrastructure(builder.Configuration);
builder.Services.AddApplicationServices();


// ======================= BUILD =======================
var app = builder.Build();

// ---------------------------------------------------------------------------
// Middleware pipeline
// ---------------------------------------------------------------------------
if (!featureFlags.EnableInMemoryCaching)
    app.Logger.LogWarning("In-memory caching is disabled by feature flag.");

app.LogRedisStartupStatus(redisResult);

bool shouldUseForwardedHeaders = app.Environment.IsDevelopment() || hasExplicitForwardedHeaderTrust;
if (shouldUseForwardedHeaders)
{
    // Trust X-Forwarded-* headers only when requests come from configured proxies/networks.
    // In production, configure ForwardedHeaders:KnownProxies / KnownNetworks so Request.IsHttps
    // reflects the original client protocol as reported by trusted reverse proxies.
    app.UseForwardedHeaders();
}
else
    app.Logger.LogWarning("Forwarded headers middleware is disabled. Configure ForwardedHeaders:KnownProxies or ForwardedHeaders:KnownNetworks.");

if (!app.Environment.IsDevelopment())
    app.UseHsts();

app.UseTijarahJoSecurityHeaders();

// CORS must be registered before static files so uploaded images get
// Access-Control-Allow-Origin headers (static files short-circuit the pipeline).
app.UseCors("AllowAll");

// Static files (uploads root: post images, chat images, user avatars)
var fileStorageOptions = app.Services.GetRequiredService<IOptions<FileStorageOptions>>().Value;
string uploadsRootPath = LocalPostImageFileStorageService.ResolveAbsoluteUploadsRootPath(
    app.Environment.ContentRootPath, fileStorageOptions);
Directory.CreateDirectory(uploadsRootPath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsRootPath),
    RequestPath = LocalPostImageFileStorageService.NormalizeRequestPath(fileStorageOptions.PublicBasePath),
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Origin", "*");
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Methods", "GET, OPTIONS");
        // Cache uploaded images for 30 days; files are content-addressed by unique names
        ctx.Context.Response.Headers.Append("Cache-Control", "public, max-age=2592000, immutable");
    }
});

if (featureFlags.EnableHttpLogging)
    app.UseHttpLogging();

app.UseTijarahJoExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

var urls = Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? "";
if (urls.Contains("https", StringComparison.OrdinalIgnoreCase))
    app.UseHttpsRedirection();

if (enableRateLimiting)
    app.UseRateLimiter();

app.UseAuthentication();
app.UseTijarahJoTokenBlacklist();
app.UseTijarahJoMaintenanceMode();

app.UseTijarahJoCsrfMiddleware();
app.UseAuthorization();
app.UseTijarahJoStatusCodePages();

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------
app.MapControllers();

if (featureFlags.EnableHealthChecks)
{
    app.MapHealthChecks("/health/live", new HealthCheckOptions
    {
        Predicate = check => check.Tags.Contains("live")
    });
    app.MapHealthChecks("/health/ready", new HealthCheckOptions
    {
        Predicate = check => check.Tags.Contains("ready")
    });
}

app.MapHub<TijarahJo.Api.Hubs.ChatHub>("/chatHub");

app.Run();

public partial class Program;
