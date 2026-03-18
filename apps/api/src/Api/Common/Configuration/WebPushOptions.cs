namespace TijarahJo.Api.Common.Configuration;

public sealed class WebPushOptions
{
    public bool Enabled { get; set; } = false;
    public string Subject { get; set; } = string.Empty;
    public string PublicKey { get; set; } = string.Empty;
    public string PrivateKey { get; set; } = string.Empty;
}
