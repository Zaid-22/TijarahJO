using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using TijarahJoDBAPI.Common.Authorization;

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
        return AppRoles.IsAdminRoleName(roleClaim);
    }

    public static bool TryParsePositiveId(string? rawId, out int id)
    {
        id = 0;

        return
            !string.IsNullOrWhiteSpace(rawId) &&
            int.TryParse(rawId.Trim(), out id) &&
            id > 0;
    }

    public static bool TryGetCurrentUserIdOrProblem(
        ControllerBase controller,
        out int userId,
        out ActionResult? failureResult)
    {
        if (TryGetCurrentUserId(controller.User, out userId))
        {
            failureResult = null;
            return true;
        }

        failureResult = controller.Problem(statusCode: StatusCodes.Status401Unauthorized, detail: "Invalid authentication token.");
        return false;
    }
}
