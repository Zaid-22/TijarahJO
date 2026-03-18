namespace TijarahJo.Api.Common.Configuration;

public sealed class GoogleAuthOptions
{
    public bool Enabled { get; set; } = false;
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string RedirectUri { get; set; } = "http://localhost:5033/api/v1/auth/google/callback";
    public string FrontendSuccessUrl { get; set; } = "http://localhost:5173/";
    public string FrontendFailureUrl { get; set; } = "http://localhost:5173/login";
    public string[] AllowedAudiences { get; set; } = [];
    public string[] AllowedIssuers { get; set; } =
    [
        "https://accounts.google.com",
        "accounts.google.com"
    ];
    public string Prompt { get; set; } = "select_account";
}
