namespace TijarahJoDBAPI.Common.Configuration;

/// <summary>
/// JWT Configuration Options
/// </summary>
public class JwtOptions
{
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int Lifetime { get; set; } = 120; // Minutes
    public string SigningKey { get; set; } = string.Empty;
}

