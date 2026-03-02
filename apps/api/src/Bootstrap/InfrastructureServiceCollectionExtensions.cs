using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TijarahJoDB.Application.Abstractions.DataAccess;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.DAL.Persistence;
using TijarahJoDB.DAL.Queries;
using TijarahJoDB.DAL.Services;
using TijarahJoDB_DataAccess;

namespace TijarahJoDB.Bootstrap;

public static class InfrastructureServiceCollectionExtensions
{
    public static IServiceCollection AddTijarahJoInfrastructure(this IServiceCollection services)
    {
        string connectionString;
        try
        {
            connectionString = DataAccessSettings.ConnectionString;
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException(
                "Database connection is not configured. Set DATABASE_CONNECTION_STRING or DB_USER and DB_PASSWORD environment variables.",
                ex
            );
        }

        services.AddDbContext<TijarahJoDbContext>(options =>
            options.UseSqlServer(connectionString));

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

        services.AddScoped<IPostListingQueryService, PostListingQueryService>();
        services.AddScoped<ISearchReadService, SearchReadService>();
        services.AddScoped<ISellerReadService, SellerReadService>();
        services.AddScoped<ILocationReadService, LocationReadService>();
        services.AddScoped<INotificationService, NotificationService>();

        return services;
    }
}
