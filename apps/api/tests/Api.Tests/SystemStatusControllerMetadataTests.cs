using Microsoft.AspNetCore.Authorization;
using TijarahJo.Api.Features.SystemStatus;

namespace TijarahJo.Api.Tests;

public sealed class SystemStatusControllerMetadataTests
{
    [Fact]
    public void Controller_HasAllowAnonymousAttribute()
    {
        var attribute = typeof(SystemStatusController)
            .GetCustomAttributes(typeof(AllowAnonymousAttribute), inherit: true)
            .SingleOrDefault();

        Assert.NotNull(attribute);
    }

    [Fact]
    public void GetStatus_IsPublic()
    {
        var method = typeof(SystemStatusController).GetMethod(nameof(SystemStatusController.GetStatus));

        Assert.NotNull(method);
        Assert.NotNull(method!.GetCustomAttributes(typeof(AllowAnonymousAttribute), inherit: true).SingleOrDefault()
            ?? typeof(SystemStatusController).GetCustomAttributes(typeof(AllowAnonymousAttribute), inherit: true).SingleOrDefault());
    }
}
