namespace TijarahJo.Api.Common.Authorization;

public static class AuthorizationPolicies
{
    public const string AdminOnly = "AdminOnly";
    public const string AdminAccess = "AdminAccess";
    public const string UsersView = "UsersView";
    public const string UsersManage = "UsersManage";
    public const string PostsView = "PostsView";
    public const string PostsModerate = "PostsModerate";
    public const string CommentsView = "CommentsView";
    public const string CommentsModerate = "CommentsModerate";
    public const string ReviewsView = "ReviewsView";
    public const string ReviewsModerate = "ReviewsModerate";
    public const string ReportsView = "ReportsView";
    public const string ReportsResolve = "ReportsResolve";
    public const string ChatView = "ChatView";
    public const string LocationsManage = "LocationsManage";
    public const string BannersManage = "BannersManage";
    public const string SettingsManage = "SettingsManage";
    public const string AuditView = "AuditView";
    public const string FraudView = "FraudView";
    public const string RolesManage = "RolesManage";
    public const string CategoriesManage = "CategoriesManage";
}
