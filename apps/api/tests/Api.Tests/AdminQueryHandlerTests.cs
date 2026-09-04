using System.Reflection;
using Microsoft.Extensions.Logging.Abstractions;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Services;

namespace TijarahJo.Api.Tests;

public sealed class AdminQueryHandlerTests
{
    [Fact]
    public async Task GetDashboardStatsAsync_DoesNotExposePersistenceExceptionDetails()
    {
        IAdminDataAccess dataAccess = DispatchProxy.Create<IAdminDataAccess, ThrowingAdminDataAccessProxy>();
        var handler = new AdminQueryHandler(dataAccess, NullLogger<AdminQueryHandler>.Instance);

        DashboardStatsQueryResult result = await handler.GetDashboardStatsAsync();

        Assert.False(result.Success);
        Assert.Equal(500, result.StatusCode);
        Assert.Equal("Failed to retrieve dashboard statistics.", result.Message);
        Assert.DoesNotContain("database-secret", result.Message, StringComparison.Ordinal);
    }

    public class ThrowingAdminDataAccessProxy : DispatchProxy
    {
        protected override object? Invoke(MethodInfo? targetMethod, object?[]? args)
        {
            throw new InvalidOperationException("database-secret");
        }
    }
}
