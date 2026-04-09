namespace TijarahJo.Infrastructure.Services;

/// <summary>
/// Configuration for Google Gemini AI API integration.
/// Bind from appsettings "Gemini" section.
/// </summary>
public sealed class GeminiSettings
{
    public string ApiKey { get; set; } = string.Empty;
    public string ModelName { get; set; } = "gemini-2.0-flash";
}
