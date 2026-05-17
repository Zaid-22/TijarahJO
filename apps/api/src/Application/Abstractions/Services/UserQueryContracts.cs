using TijarahJo.Domain.Models;

namespace TijarahJo.Application.Abstractions.Services;

public sealed class UserByIdQuery
{
    public int TargetUserId { get; init; }
    public int? RequesterUserId { get; init; }
    public bool RequesterIsAdmin { get; init; }
}

public sealed class UserListQueryResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string? Message { get; init; }
    public IReadOnlyList<UserModel> Users { get; init; } = [];
}

public sealed class UserByIdQueryResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string? Message { get; init; }
    public UserModel? User { get; init; }
}

public sealed class UserExistsQueryResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string? Message { get; init; }
    public bool Exists { get; init; }
}

public interface IUserQueryHandler
{
    Task<UserListQueryResult> GetAllAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default);

    Task<UserByIdQueryResult> GetByIdAsync(UserByIdQuery query, CancellationToken cancellationToken = default);

    Task<UserExistsQueryResult> ExistsAsync(int userId, CancellationToken cancellationToken = default);
}
