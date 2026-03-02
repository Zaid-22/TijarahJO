using TijarahJoDB.Application.Abstractions.Services;

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
