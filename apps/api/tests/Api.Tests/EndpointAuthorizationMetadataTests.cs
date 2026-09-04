using Microsoft.AspNetCore.Authorization;
using TijarahJo.Api.Common.Authorization;
using TijarahJo.Api.Features.Posts;
using TijarahJo.Api.Features.Roles;

namespace TijarahJo.Api.Tests;

public sealed class EndpointAuthorizationMetadataTests
{
    [Theory]
    [InlineData(nameof(RolesController.GetAllRoles))]
    [InlineData(nameof(RolesController.GetRoleById))]
    [InlineData(nameof(RolesController.DoesRoleExist))]
    public void RoleReadEndpoints_RequireAdminAccess(string methodName)
    {
        AssertPolicy<RolesController>(methodName, AuthorizationPolicies.AdminAccess);
    }

    [Theory]
    [InlineData(nameof(PostImagesController.GetAllPostImages))]
    [InlineData(nameof(PostImagesController.DoesPostImageExist))]
    public void PostImageInventoryEndpoints_RequirePostsView(string methodName)
    {
        AssertPolicy<PostImagesController>(methodName, AuthorizationPolicies.PostsView);
    }

    [Theory]
    [InlineData(nameof(PostImagesController.GetPostImagesByPostId))]
    [InlineData(nameof(PostImagesController.GetPostImageById))]
    public void PublicPostImageEndpoints_AreExplicitlyAnonymous(string methodName)
    {
        var method = typeof(PostImagesController).GetMethod(methodName);

        Assert.NotNull(method);
        Assert.Single(method.GetCustomAttributes(typeof(AllowAnonymousAttribute), inherit: true));
    }

    private static void AssertPolicy<TController>(string methodName, string expectedPolicy)
    {
        var method = typeof(TController).GetMethod(methodName);

        Assert.NotNull(method);
        AuthorizeAttribute authorize = Assert.Single(
            method.GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)
                .Cast<AuthorizeAttribute>());
        Assert.Equal(expectedPolicy, authorize.Policy);
    }
}
