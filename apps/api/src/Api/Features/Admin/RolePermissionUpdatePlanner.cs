namespace TijarahJo.Api.Features.Admin;

public sealed record RolePermissionUpdatePlan(
    IReadOnlyCollection<int> NormalizedPermissionIds,
    IReadOnlyCollection<int> PermissionIdsToAdd,
    IReadOnlyCollection<int> PermissionIdsToRemove);

public static class RolePermissionUpdatePlanner
{
    public static RolePermissionUpdatePlan Create(
        IEnumerable<int> existingPermissionIds,
        IEnumerable<int>? requestedPermissionIds)
    {
        var normalizedPermissionIds = (requestedPermissionIds ?? [])
            .Where(permissionId => permissionId > 0)
            .Distinct()
            .ToArray();

        var existingPermissionIdSet = new HashSet<int>(
            existingPermissionIds.Where(permissionId => permissionId > 0));
        var normalizedPermissionIdSet = new HashSet<int>(normalizedPermissionIds);

        var permissionIdsToAdd = normalizedPermissionIds
            .Where(permissionId => !existingPermissionIdSet.Contains(permissionId))
            .ToArray();

        var permissionIdsToRemove = existingPermissionIdSet
            .Where(permissionId => !normalizedPermissionIdSet.Contains(permissionId))
            .ToArray();

        return new RolePermissionUpdatePlan(
            normalizedPermissionIds,
            permissionIdsToAdd,
            permissionIdsToRemove);
    }
}
