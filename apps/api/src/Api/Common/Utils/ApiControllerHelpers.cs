using System.Security.Claims;

namespace TijarahJoDBAPI.Common.Utils;

public static class ApiControllerHelpers
{
    public static bool TryGetCurrentUserId(ClaimsPrincipal user, out int userId)
    {
        userId = 0;

        string? userIdClaim =
            user.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
            user.FindFirst("id")?.Value;

        return
            !string.IsNullOrWhiteSpace(userIdClaim) &&
            int.TryParse(userIdClaim, out userId) &&
            userId > 0;
    }

    public static bool IsAdminUser(ClaimsPrincipal user)
    {
        string? roleClaim = user.FindFirst(ClaimTypes.Role)?.Value;
        return int.TryParse(roleClaim, out int roleId) && roleId == 1;
    }

    public static bool TryParsePositiveId(string? rawId, out int id)
    {
        id = 0;

        return
            !string.IsNullOrWhiteSpace(rawId) &&
            int.TryParse(rawId.Trim(), out id) &&
            id > 0;
    }
}
