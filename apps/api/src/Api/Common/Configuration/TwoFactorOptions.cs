namespace TijarahJoDBAPI.Common.Configuration;

public sealed class TwoFactorOptions
{
    public string Issuer { get; set; } = "TijarahJo";
    public int TimeStepSeconds { get; set; } = 30;
    public int AllowedTimeDriftSteps { get; set; } = 1;
    public int Digits { get; set; } = 6;
    public int LoginChallengeLifetimeSeconds { get; set; } = 300;
    public string? SecretEncryptionKey { get; set; }
    public string? ChallengeSigningKey { get; set; }
}
