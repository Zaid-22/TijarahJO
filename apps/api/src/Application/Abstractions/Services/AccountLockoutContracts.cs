namespace TijarahJo.Application.Abstractions.Services;

public interface IAccountLockoutService
{
    Task<AccountLockoutResult> IsLockedOutAsync(int userId, CancellationToken cancellationToken = default);
    Task RecordFailedAttemptAsync(int userId, CancellationToken cancellationToken = default);
    Task ClearLockoutAsync(int userId, CancellationToken cancellationToken = default);
}

public sealed record AccountLockoutResult(
    bool IsLockedOut,
    int FailedAttempts = 0,
    DateTime? LockedUntilUtc = null
);
