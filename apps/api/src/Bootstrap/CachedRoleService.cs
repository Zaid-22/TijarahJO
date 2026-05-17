using Microsoft.Extensions.Caching.Memory;
using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Common;

namespace TijarahJo.Bootstrap;

/// <summary>
/// Decorator that adds in-memory caching to <see cref="IRoleService"/>.
/// Roles are essentially static reference data — caching them eliminates
/// a DB round-trip on every login and every user registration.
/// </summary>
public sealed class CachedRoleService(IRoleService inner, IMemoryCache cache) : IRoleService
{
    private const string AllRolesCacheKey = "CachedRoleService:GetAllRolesAsync";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

    public async Task<IReadOnlyList<RoleModel>> GetAllRolesAsync(CancellationToken cancellationToken = default)
    {
        if (cache.TryGetValue(AllRolesCacheKey, out IReadOnlyList<RoleModel>? cached) && cached is not null)
        {
            return cached;
        }

        IReadOnlyList<RoleModel> roles = await inner.GetAllRolesAsync(cancellationToken);

        cache.Set(AllRolesCacheKey, roles, new MemoryCacheEntryOptions
        {
            SlidingExpiration = CacheDuration
        });

        return roles;
    }

    // Pass-through methods — mutations always go to the inner service and invalidate the cache.

    public Task<Role?> FindAsync(int? roleId, CancellationToken cancellationToken = default)
        => inner.FindAsync(roleId, cancellationToken);

    public Role Create(RoleModel model) => inner.Create(model);

    public async Task<bool> SaveAsync(Role role, CancellationToken cancellationToken = default)
    {
        bool result = await inner.SaveAsync(role, cancellationToken);
        if (result)
        {
            cache.Remove(AllRolesCacheKey);
        }
        return result;
    }

    public async Task<bool> DeleteRoleAsync(int? roleId, CancellationToken cancellationToken = default)
    {
        bool result = await inner.DeleteRoleAsync(roleId, cancellationToken);
        if (result)
        {
            cache.Remove(AllRolesCacheKey);
        }
        return result;
    }

    public Task<bool> DoesRoleExistAsync(int? roleId, CancellationToken cancellationToken = default)
        => inner.DoesRoleExistAsync(roleId, cancellationToken);
}
