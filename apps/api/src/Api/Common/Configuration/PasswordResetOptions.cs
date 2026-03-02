namespace TijarahJoDBAPI.Common.Configuration;

public sealed class PasswordResetOptions
{
    public bool Enabled { get; set; } = true;
    public int CodeLength { get; set; } = 6;
    public int CodeLifetimeMinutes { get; set; } = 15;
    public int MaxAttempts { get; set; } = 5;
    public int RequestCooldownSeconds { get; set; } = 60;
}
