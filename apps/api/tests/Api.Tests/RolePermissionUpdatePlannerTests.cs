using TijarahJo.Api.Features.Admin;

namespace TijarahJo.Api.Tests;

public sealed class RolePermissionUpdatePlannerTests
{
    [Fact]
    public void Create_RemovesDuplicates_AndKeepsExistingAssignmentsUntouched()
    {
        RolePermissionUpdatePlan plan = RolePermissionUpdatePlanner.Create(
            existingPermissionIds: [1, 2],
            requestedPermissionIds: [2, 1, 2, 1]);

        Assert.Equal([2, 1], plan.NormalizedPermissionIds);
        Assert.Empty(plan.PermissionIdsToAdd);
        Assert.Empty(plan.PermissionIdsToRemove);
    }

    [Fact]
    public void Create_ComputesAdditionsAndRemovals_FromRequestedSet()
    {
        RolePermissionUpdatePlan plan = RolePermissionUpdatePlanner.Create(
            existingPermissionIds: [1, 2],
            requestedPermissionIds: [2, 3, 3, 0, -4]);

        Assert.Equal([2, 3], plan.NormalizedPermissionIds);
        Assert.Equal([3], plan.PermissionIdsToAdd);
        Assert.Equal([1], plan.PermissionIdsToRemove);
    }
}
