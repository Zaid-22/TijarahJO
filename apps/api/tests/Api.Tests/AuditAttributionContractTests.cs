using TijarahJo.Application.Abstractions.DataAccess;

namespace TijarahJo.Api.Tests;

public sealed class AuditAttributionContractTests
{
    [Fact]
    public void UserDataAccess_UpdateUserAsync_RequiresActorUserIdParameter()
    {
        var method = typeof(IUserDataAccess).GetMethod(nameof(IUserDataAccess.UpdateUserAsync));

        Assert.NotNull(method);
        Assert.Contains(
            method!.GetParameters(),
            parameter => parameter.ParameterType == typeof(int)
                && string.Equals(parameter.Name, "actorUserId", StringComparison.OrdinalIgnoreCase)
        );
    }
}
