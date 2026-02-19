using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Threading.Tasks;
using TijarahJoDB_DataAccess;
using TijarahJoDB.DAL;
using TijarahJoDB.Application.Abstractions.DataAccess;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.Application.Services;
using TijarahJoDBAPI.Common.Configuration;
using TijarahJoDBAPI.Common.Services;
using TijarahJoDB.DAL.Persistence;
using TijarahJoDB.DAL.Queries;

var builder = WebApplication.CreateBuilder(args);

// Configure JSON serialization to preserve PascalCase (matching frontend expectations)
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = null; // Preserve PascalCase
});
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-Token";
    options.Cookie.Name = "tj-csrf";
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    options.Cookie.SameSite = SameSiteMode.Lax;
});

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

// Fail fast if database configuration is missing. Without this, app starts and fails later on first DB request.
try
{
    _ = DataAccessSettings.ConnectionString;
}
catch (Exception ex)
{
    throw new InvalidOperationException(
        "Database connection is not configured. Set DATABASE_CONNECTION_STRING or DB_USER and DB_PASSWORD environment variables.",
        ex
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
builder.Services.AddScoped<PostListingQueryService>();
builder.Services.AddDbContext<TijarahJoDbContext>(options =>
    options.UseSqlServer(DataAccessSettings.ConnectionString));
builder.Services.AddScoped<IUserDataAccess, UserDataAccessAdapter>();
builder.Services.AddScoped<ICategoryDataAccess, CategoryDataAccessAdapter>();
builder.Services.AddScoped<IRoleDataAccess, RoleDataAccessAdapter>();
builder.Services.AddScoped<IPostDataAccess, PostDataAccessAdapter>();
builder.Services.AddScoped<IPostImageDataAccess, PostImageDataAccessAdapter>();
builder.Services.AddScoped<IFavoriteDataAccess, FavoriteDataAccessAdapter>();
builder.Services.AddScoped<IMessageDataAccess, MessageDataAccessAdapter>();
builder.Services.AddScoped<IReviewDataAccess, ReviewDataAccessAdapter>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IPostService, PostService>();
builder.Services.AddScoped<IPostImageService, PostImageService>();
builder.Services.AddScoped<IFavoriteService, FavoriteService>();
builder.Services.AddScoped<IMessageService, MessageService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<ISearchReadService, SearchReadService>();
builder.Services.AddScoped<ISellerReadService, SellerReadService>();

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
        // Production: Get allowed origins from environment variable or configuration
        var allowedOrigins = builder.Configuration["CORS:AllowedOrigins"]?.Split(',') 
            ?? new[] { builder.Configuration["FrontendUrl"] ?? "https://your-frontend-domain.com" };
        
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
        context.Response.ContentType = "application/json";
        if (isDevelopment)
        {
            await context.Response.WriteAsJsonAsync(new
            {
                message = "An internal server error occurred.",
                detail = exceptionFeature?.Error?.Message
            });
            return;
        }

        await context.Response.WriteAsJsonAsync(new
        {
            message = "An internal server error occurred."
        });
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
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new
            {
                success = false,
                message = "CSRF validation failed."
            });
            return;
        }
    }

    await next();
});

app.UseAuthorization();

app.MapControllers();
// Map ChatHub
app.MapHub<TijarahJoDBAPI.Hubs.ChatHub>("/chatHub");

app.Run();

public partial class Program;
