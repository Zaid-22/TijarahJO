using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Cryptography;
using System.Text;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Infrastructure.Persistence;
using TijarahJo.Infrastructure.Queries;
using TijarahJo.Infrastructure.Services;
using TijarahJo.Infrastructure.Caching;
using TijarahJo.Infrastructure.DataAccess;
using TijarahJo.Infrastructure;

namespace TijarahJo.Bootstrap;

public static class InfrastructureServiceCollectionExtensions
{
    public static IServiceCollection AddTijarahJoInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        string connectionString;
        try
        {
            connectionString = DataAccessSettings.ResolveConnectionString(configuration);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException(
                "Database connection is not configured. Set DATABASE_CONNECTION_STRING or DB_USER and DB_PASSWORD environment variables.",
                ex
            );
        }

        services.AddDbContext<TijarahJoDbContext>(options =>
            options.UseSqlServer(connectionString)
                   .AddInterceptors(new UpdatedAtInterceptor()));

        // Resolve the TOTP encryption key using the same environment rules as TwoFactorService.
        string? twoFactorEncKey = configuration["TwoFactor:SecretEncryptionKey"];
        string? jwtKey = configuration["JWT:SigningKey"]
                         ?? Environment.GetEnvironmentVariable("JWT_SIGNING_KEY");
        string secretKeyMaterial = TijarahJo.Api.Common.Services.TwoFactorService.ResolveTwoFactorKeyMaterial(
            twoFactorEncKey,
            jwtKey,
            "TwoFactor:SecretEncryptionKey",
            "twofactor-secret"
        );
        byte[] totpKey = SHA256.HashData(Encoding.UTF8.GetBytes(secretKeyMaterial));
        services.AddSingleton(new TotpEncryptionKey(totpKey));
        services.AddScoped<IUserDataAccess, UserDataAccessAdapter>();
        services.AddScoped<IExternalIdentityDataAccess, ExternalIdentityDataAccessAdapter>();
        services.AddScoped<ICategoryDataAccess, CategoryDataAccessAdapter>();
        services.AddScoped<IRoleDataAccess, RoleDataAccessAdapter>();
        services.AddScoped<IPostDataAccess, PostDataAccessAdapter>();
        services.AddScoped<IPostImageDataAccess, PostImageDataAccessAdapter>();
        services.AddScoped<IFavoriteDataAccess, FavoriteDataAccessAdapter>();
        services.AddScoped<IMessageDataAccess, MessageDataAccessAdapter>();
        services.AddScoped<IConversationDataAccess, ConversationDataAccessAdapter>();
        services.AddScoped<IReviewDataAccess, ReviewDataAccessAdapter>();
        services.AddScoped<IAdminDataAccess, AdminDataAccessAdapter>();

        // Register the resolved connection string so raw-SQL services can inject it.
        services.AddSingleton(new DatabaseConnectionString(connectionString));

        services.AddScoped<IPostListingQueryService, PostListingQueryService>();
        services.AddScoped<ISearchReadService, SearchReadService>();
        services.AddScoped<ISellerReadService, SellerReadService>();
        services.AddScoped<ILocationReadService, LocationReadService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddSingleton<ICacheService, HybridCacheService>();

        services.AddSingleton<TijarahJo.Infrastructure.Jobs.ChannelBackgroundJobService>();
        services.AddSingleton<IBackgroundJobService>(sp => sp.GetRequiredService<TijarahJo.Infrastructure.Jobs.ChannelBackgroundJobService>());
        services.AddHostedService<TijarahJo.Infrastructure.Jobs.BackgroundJobWorker>();

        services.AddScoped<ITokenBlacklistService, TijarahJo.Infrastructure.Services.DatabaseTokenBlacklistService>();

        return services;
    }
}
