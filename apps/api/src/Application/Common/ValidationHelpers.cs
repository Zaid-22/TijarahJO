namespace TijarahJoDB.Application.Common;

/// <summary>
/// Shared validation logic used by multiple command services.
/// </summary>
public static class ValidationHelpers
{
    /// <summary>
    /// Returns true if <paramref name="avatar"/> is a valid http or https URL.
    /// </summary>
    public static bool IsValidAvatarUrl(string avatar)
    {
        return Uri.TryCreate(avatar.Trim(), UriKind.Absolute, out Uri? uri)
               && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
    }
}
