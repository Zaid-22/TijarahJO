using TijarahJo.Domain.Models;

namespace TijarahJo.Application.Abstractions.Services;

public sealed class RoleListQueryResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string? Message { get; init; }
    public IReadOnlyList<RoleModel> Roles { get; init; } = [];
}

public sealed class RoleByIdQueryResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string? Message { get; init; }
    public RoleModel? Role { get; init; }
}

public sealed class RoleExistsQueryResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string? Message { get; init; }
    public bool Exists { get; init; }
}

public interface IRoleQueryHandler
{
    Task<RoleListQueryResult> GetAllAsync(CancellationToken cancellationToken = default);

    Task<RoleByIdQueryResult> GetByIdAsync(int roleId, CancellationToken cancellationToken = default);

    Task<RoleExistsQueryResult> ExistsAsync(int roleId, CancellationToken cancellationToken = default);
}
