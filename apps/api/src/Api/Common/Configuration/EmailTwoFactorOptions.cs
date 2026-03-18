namespace TijarahJo.Api.Common.Configuration;

public sealed class EmailTwoFactorOptions
{
    public bool Enabled { get; set; } = true;
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public bool EnableSsl { get; set; } = true;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromAddress { get; set; } = "noreply@tijarahjo.local";
    public string FromName { get; set; } = "TijarahJo Security";
    public bool LogCodesWhenEmailDisabled { get; set; } = true;
}
