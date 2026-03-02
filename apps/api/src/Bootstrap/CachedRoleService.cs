using Microsoft.Extensions.Caching.Memory;
using TijarahJo.Domain.Models;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.BLL;

namespace TijarahJoDB.Bootstrap;

/// <summary>
/// Decorator that adds in-memory caching to <see cref="IRoleService"/>.
/// Roles are essentially static reference data — caching them eliminates
/// a DB round-trip on every login and every user registration.
/// </summary>
public sealed class CachedRoleService : IRoleService
{
    private const string AllRolesCacheKey = "CachedRoleService:GetAllRolesAsync";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

    private readonly IRoleService _inner;
    private readonly IMemoryCache _cache;

    public CachedRoleService(IRoleService inner, IMemoryCache cache)
    {
        _inner = inner;
        _cache = cache;
    }

    public async Task<IReadOnlyList<RoleModel>> GetAllRolesAsync(CancellationToken cancellationToken = default)
    {
        if (_cache.TryGetValue(AllRolesCacheKey, out IReadOnlyList<RoleModel>? cached) && cached is not null)
        {
            return cached;
        }

        IReadOnlyList<RoleModel> roles = await _inner.GetAllRolesAsync(cancellationToken);

        _cache.Set(AllRolesCacheKey, roles, new MemoryCacheEntryOptions
        {
            SlidingExpiration = CacheDuration
        });

        return roles;
    }

    // Pass-through methods — mutations always go to the inner service and invalidate the cache.

    public Task<Role?> FindAsync(int? roleId, CancellationToken cancellationToken = default)
        => _inner.FindAsync(roleId, cancellationToken);

    public Role Create(RoleModel model) => _inner.Create(model);

    public async Task<bool> SaveAsync(Role role, CancellationToken cancellationToken = default)
    {
        bool result = await _inner.SaveAsync(role, cancellationToken);
        if (result)
        {
            _cache.Remove(AllRolesCacheKey);
        }
        return result;
    }

    public async Task<bool> DeleteRoleAsync(int? roleId, CancellationToken cancellationToken = default)
    {
        bool result = await _inner.DeleteRoleAsync(roleId, cancellationToken);
        if (result)
        {
            _cache.Remove(AllRolesCacheKey);
        }
        return result;
    }

    public Task<bool> DoesRoleExistAsync(int? roleId, CancellationToken cancellationToken = default)
        => _inner.DoesRoleExistAsync(roleId, cancellationToken);
}
