using Microsoft.AspNetCore.Mvc;
using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Api.Features.Favorites;

internal static class FavoritesControllerExtensions
{
    internal static ActionResult ToFavoriteListQueryProblem(
        this ControllerBase controller,
        FavoriteListQueryResult result,
        string fallbackDetail)
    {
        int status = result.StatusCode > 0 ? result.StatusCode : StatusCodes.Status500InternalServerError;
        return controller.Problem(statusCode: status, detail: result.Message ?? fallbackDetail);
    }

    internal static ActionResult ToFavoriteOperationQueryProblem(
        this ControllerBase controller,
        FavoriteOperationQueryResult result,
        string fallbackDetail)
    {
        int status = result.StatusCode > 0 ? result.StatusCode : StatusCodes.Status500InternalServerError;
        return controller.Problem(statusCode: status, detail: result.Message ?? fallbackDetail);
    }
}
