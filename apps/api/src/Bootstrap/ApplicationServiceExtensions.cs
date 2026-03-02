using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.Application.Services;

namespace TijarahJoDB.Bootstrap;

/// <summary>
/// Registers all Application-layer services (query handlers, command services,
/// business logic, and singleton services). Split from Program.cs to keep
/// the composition root lean and group services by concern.
/// </summary>
public static class ApplicationServiceExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Auth
        services.AddScoped<IAuthCommandService, AuthCommandService>();

        // Users

        services.AddScoped<IUserQueryHandler, UserQueryHandler>();
        services.AddScoped<IUserCommandService, UserCommandService>();

        // Categories
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<ICategoryQueryHandler, CategoryQueryHandler>();
        services.AddScoped<ICategoryCommandService, CategoryCommandService>();

        // Roles — CachedRoleService wraps RoleService with a 5-minute in-memory cache.
        // This eliminates a DB hit on every login / registration for role lookups.
        services.AddScoped<RoleService>();
        services.AddScoped<IRoleService>(sp =>
            new CachedRoleService(
                sp.GetRequiredService<RoleService>(),
                sp.GetRequiredService<IMemoryCache>()
            ));
        services.AddScoped<IRoleQueryHandler, RoleQueryHandler>();
        services.AddScoped<IRoleCommandService, RoleCommandService>();

        // Posts
        services.AddScoped<IPostService, PostService>();
        services.AddScoped<IPostReadService, PostReadService>();
        services.AddScoped<IPostStatusTransitionService, PostStatusTransitionService>();
        services.AddScoped<IPostMutationService, PostMutationService>();

        // Post Images
        services.AddScoped<IPostImageService, PostImageService>();
        services.AddScoped<IPostImageQueryHandler, PostImageQueryHandler>();
        services.AddScoped<IPostImageCommandService, PostImageCommandService>();

        // Favorites
        services.AddScoped<IFavoriteService, FavoriteService>();
        services.AddScoped<IFavoriteCommandService, FavoriteCommandService>();
        services.AddScoped<IFavoriteQueryHandler, FavoriteQueryHandler>();

        // Messaging & Chat
        services.AddScoped<IMessageService, MessageService>();
        services.AddScoped<IChatOrchestrationService, ChatOrchestrationService>();

        // Search
        services.AddScoped<ISearchExecutionService, SearchExecutionService>();
        services.AddScoped<ISearchQueryHandler, SearchQueryHandler>();

        // Sellers
        services.AddScoped<ISellerProfileService, SellerProfileService>();
        services.AddScoped<ISellerQueryHandler, SellerQueryHandler>();

        // Notifications
        services.AddScoped<INotificationQueryHandler, NotificationQueryHandler>();

        // Reviews
        services.AddScoped<IReviewService, ReviewService>();
        services.AddScoped<IReviewSubmissionService, ReviewSubmissionService>();

        // Admin
        services.AddScoped<IAdminQueryHandler, AdminQueryHandler>();

        return services;
    }
}
