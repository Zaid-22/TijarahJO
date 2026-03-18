namespace TijarahJo.Api.Contracts.Responses;

public sealed class TwoFactorSetupStartResponse
{
    public bool Success { get; set; }
    public string SecretKey { get; set; } = string.Empty;
    public string OtpAuthUri { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
