using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Application.Common;

/// <summary>
/// Shared validation logic used by multiple command services.
/// </summary>
public static class ValidationHelpers
{
    /// <summary>
    /// Returns true when the stored avatar is effectively the app's generic placeholder
    /// rather than a user-specific profile image.
    /// </summary>
    public static bool IsDefaultAvatarPlaceholder(string? avatar)
    {
        string trimmed = avatar?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(trimmed))
        {
            return true;
        }

        return trimmed.Equals("/default-avatar.svg", StringComparison.OrdinalIgnoreCase) ||
               trimmed.Equals("default-avatar.svg", StringComparison.OrdinalIgnoreCase) ||
               trimmed.EndsWith("/default-avatar.svg", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Returns true if <paramref name="avatar"/> is a valid avatar URL.
    /// Accepts absolute http/https URLs (e.g. Google avatar) and
    /// server-relative upload paths (e.g. /uploads/user-avatars/img.jpg).
    /// </summary>
    public static bool IsValidAvatarUrl(string avatar)
    {
        string trimmed = avatar.Trim();

        // Accept relative upload paths (local file storage)
        if (trimmed.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return Uri.TryCreate(trimmed, UriKind.Absolute, out Uri? uri)
               && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
    }

    /// <summary>
    /// Validates that the supplied city exists and (if provided) the area belongs to that city.
    /// Returns <c>(true, "")</c> on success, or <c>(false, "reason")</c> on failure.
    /// </summary>
    public static async Task<(bool IsValid, string Message)> ValidateLocationAsync(
        ILocationReadService locations,
        int? cityId,
        int? areaId,
        CancellationToken cancellationToken)
    {
        if (!cityId.HasValue)
        {
            return (true, string.Empty);
        }

        if (cityId.Value < 1)
        {
            return (false, "CityId must be a positive integer.");
        }

        IReadOnlyList<CityLookupResult> cities = await locations.GetCitiesAsync(cancellationToken);
        bool cityExists = cities.Any(city => city.CityId == cityId.Value);
        if (!cityExists)
        {
            return (false, "Selected city is invalid.");
        }

        if (!areaId.HasValue)
        {
            return (true, string.Empty);
        }

        if (areaId.Value < 1)
        {
            return (false, "AreaId must be a positive integer.");
        }

        IReadOnlyList<AreaLookupResult> areas = await locations.GetAreasByCityAsync(cityId.Value, cancellationToken);
        bool areaBelongsToCity = areas.Any(area => area.AreaId == areaId.Value);
        if (!areaBelongsToCity)
        {
            return (false, "Selected area does not belong to the selected city.");
        }

        return (true, string.Empty);
    }
}
