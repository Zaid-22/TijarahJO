namespace TijarahJo.Api.Common.Configuration;

public sealed class EmailVerificationOptions
{
    public bool Enabled { get; set; } = true;
    public int TokenLifetimeMinutes { get; set; } = 1440; // 24 hours
    public int RequestCooldownSeconds { get; set; } = 60;
    public string ResendApiKey { get; set; } = string.Empty;
    public string FromAddress { get; set; } = "no-reply@tijarahjo.local";
    public string FromName { get; set; } = "TijarahJo";
    public bool LogTokensWhenEmailDisabled { get; set; } = false;
}
