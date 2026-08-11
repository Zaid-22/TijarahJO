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

var builder = WebApplication.CreateBuilder(args);

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
builder.Services.AddOptions<EmailVerificationOptions>()
    .Bind(builder.Configuration.GetSection("EmailVerification"))
    .ValidateOnStart();
builder.Services.AddSingleton<IValidateOptions<EmailVerificationOptions>>(
    new EmailVerificationOptionsValidator(builder.Environment.IsProduction()));
builder.Services.Configure<AccountLockoutOptions>(builder.Configuration.GetSection("AccountLockout"));
builder.Services.Configure<GeminiSettings>(builder.Configuration.GetSection("Gemini"));
builder.Services.Configure<YouTubeSettings>(builder.Configuration.GetSection("YouTube"));
builder.Services.Configure<ImageModerationOptions>(builder.Configuration.GetSection("ImageModeration"));
builder.Services.AddHttpClient<GoogleAuthService>();
builder.Services.AddHttpClient<IPostCompareService, GeminiPostCompareService>();
builder.Services.AddHttpClient<ICompareVideoRecommendationService, YouTubeCompareVideoRecommendationService>((serviceProvider, client) =>
{
    var youtubeSettings = serviceProvider.GetRequiredService<IOptions<YouTubeSettings>>().Value;
    string referer = youtubeSettings.Referer?.Trim() ?? string.Empty;
    if (string.IsNullOrWhiteSpace(referer))
    {
        return;
    }

    if (!Uri.TryCreate(referer, UriKind.Absolute, out var refererUri))
    {
        throw new InvalidOperationException("YouTube:Referer must be an absolute URL when configured.");
    }

    client.DefaultRequestHeaders.Referrer = refererUri;
});

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
                PermitLimit = 240,
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
builder.Services.AddScoped<IEmailVerificationService, EmailVerificationService>();
builder.Services.AddScoped<IAccountLockoutService, AccountLockoutService>();
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

// Always enable forwarded headers. In production behind a reverse proxy (nginx),
// X-Forwarded-Proto must be processed so Request.IsHttps is correct for OAuth
// state cookies, CSRF, and HSTS. The KnownProxies/KnownNetworks options already
// limit which proxies are trusted; the middleware itself should always be active.
app.UseForwardedHeaders();
if (!app.Environment.IsDevelopment() && !hasExplicitForwardedHeaderTrust)
    app.Logger.LogWarning("Forwarded headers middleware is active but no KnownProxies or KnownNetworks are configured. Configure ForwardedHeaders:KnownProxies or ForwardedHeaders:KnownNetworks for production.");

if (!app.Environment.IsDevelopment())
    app.UseHsts();

app.UseTijarahJoSecurityHeaders();

// CORS must be registered before static files so uploaded images get
// Access-Control-Allow-Origin headers (static files short-circuit the pipeline).
app.UseCors("TijarahJoCors");

// Static files (uploads root: category images, post images, chat images, user avatars)
var fileStorageOptions = app.Services.GetRequiredService<IOptions<FileStorageOptions>>().Value;
string uploadsRootPath = LocalPostImageFileStorageService.ResolveAbsoluteUploadsRootPath(
    app.Environment.ContentRootPath, fileStorageOptions);
Directory.CreateDirectory(uploadsRootPath);
BundledUploadInitializer.CopyBundledUploadDirectory(
    app.Environment.ContentRootPath, uploadsRootPath, "category-images", app.Logger);
BundledUploadInitializer.CopyBundledUploadDirectory(
    app.Environment.ContentRootPath, uploadsRootPath, "post-images", app.Logger);
await BundledUploadInitializer.EnsureMissingThumbnailsAsync(
    uploadsRootPath, fileStorageOptions, app.Logger);

string uploadsRequestPath = LocalPostImageFileStorageService.NormalizeRequestPath(fileStorageOptions.PublicBasePath);
app.UseUploadThumbnailFallback(uploadsRootPath, uploadsRequestPath);
app.Use(async (context, next) =>
{
    // Chat attachments and report evidence used to share the public uploads root.
    // Deny those legacy locations before static files so historical media is protected too.
    string chatPath = $"{uploadsRequestPath}/{fileStorageOptions.ChatImagesPath.Trim().Trim('/')}";
    string reportPath = $"{uploadsRequestPath}/{fileStorageOptions.ReportImagesPath.Trim().Trim('/')}";
    if (context.Request.Path.StartsWithSegments(chatPath, StringComparison.OrdinalIgnoreCase) ||
        context.Request.Path.StartsWithSegments(reportPath, StringComparison.OrdinalIgnoreCase))
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return;
    }

    await next();
});
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsRootPath),
    RequestPath = LocalPostImageFileStorageService.NormalizeRequestPath(fileStorageOptions.PublicBasePath),
    OnPrepareResponse = ctx =>
    {
        // SECURITY NOTE: Wildcard origin is intentional for uploaded images.
        // These are public, content-addressed files (unique filenames) and do not
        // require origin-restricted access. This avoids CORS preflight for <img> tags.
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
