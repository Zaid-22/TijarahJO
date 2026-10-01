namespace TijarahJo.Api.Common.Configuration;

public sealed class AccountLockoutOptions
{
    public bool Enabled { get; set; } = true;
    public int MaxFailedAttempts { get; set; } = 5;
    public int LockoutDurationMinutes { get; set; } = 15;
}
