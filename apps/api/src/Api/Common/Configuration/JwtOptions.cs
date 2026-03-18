namespace TijarahJo.Api.Common.Configuration;

/// <summary>
/// JWT Configuration Options
/// </summary>
public sealed class JwtOptions
{
    public string Issuer { get; init; } = string.Empty;
    public string Audience { get; init; } = string.Empty;
    public int Lifetime { get; init; } = 120; // Minutes
    public string SigningKey { get; init; } = string.Empty;
}

