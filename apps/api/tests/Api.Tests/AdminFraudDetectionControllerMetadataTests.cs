using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TijarahJo.Api.Features.Admin;

namespace TijarahJo.Api.Tests;

/// <summary>
/// Metadata tests for AdminFraudDetectionController.
/// Validates that route conventions, authorization, and HTTP method attributes
/// are correctly applied after the controller refactoring.
/// </summary>
public sealed class AdminFraudDetectionControllerMetadataTests
{
    private static readonly Type ControllerType = typeof(AdminFraudDetectionController);

    [Fact]
    public void Controller_HasApiControllerAttribute()
    {
        Assert.NotNull(ControllerType.GetCustomAttribute<ApiControllerAttribute>());
    }

    [Fact]
    public void Controller_HasRouteAttribute()
    {
        var route = ControllerType.GetCustomAttribute<RouteAttribute>();
        Assert.NotNull(route);
        Assert.Contains("admin", route.Template!, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Controller_HasAuthorizeAttribute_WithAdminPolicy()
    {
        var authorize = ControllerType.GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(authorize);
    }

    [Fact]
    public void GetFraudSignals_HasHttpGetAttribute()
    {
        var method = ControllerType.GetMethod("GetFraudSignals");
        Assert.NotNull(method);

        var httpGet = method.GetCustomAttribute<HttpGetAttribute>();
        Assert.NotNull(httpGet);
        Assert.Equal("signals", httpGet.Template);
    }

    [Fact]
    public void GetFraudSignals_AcceptsCancellationToken()
    {
        var method = ControllerType.GetMethod("GetFraudSignals");
        Assert.NotNull(method);

        var parameters = method.GetParameters();
        Assert.Single(parameters);
        Assert.Equal(typeof(CancellationToken), parameters[0].ParameterType);
    }

    [Fact]
    public void GetFraudSignals_ReturnsActionResult()
    {
        var method = ControllerType.GetMethod("GetFraudSignals");
        Assert.NotNull(method);
        Assert.True(typeof(Task<ActionResult>).IsAssignableFrom(method.ReturnType));
    }

    [Fact]
    public void Controller_InjectsFraudDetectionService()
    {
        var constructors = ControllerType.GetConstructors();
        Assert.Single(constructors);

        var parameters = constructors[0].GetParameters();
        Assert.Contains(parameters, p =>
            p.ParameterType.Name.Contains("IFraudDetectionService", StringComparison.Ordinal));
    }
}
