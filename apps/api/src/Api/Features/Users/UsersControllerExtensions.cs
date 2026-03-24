using Microsoft.AspNetCore.Mvc;
using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Api.Features.Users;

internal static class UsersControllerExtensions
{
    internal static ActionResult ToUserListQueryProblem(
        this ControllerBase controller,
        UserListQueryResult result,
        string fallbackDetail)
    {
        int status = result.StatusCode > 0 ? result.StatusCode : StatusCodes.Status500InternalServerError;
        return controller.Problem(statusCode: status, detail: result.Message ?? fallbackDetail);
    }

    internal static ActionResult ToUserByIdQueryProblem(
        this ControllerBase controller,
        UserByIdQueryResult result,
        string fallbackDetail)
    {
        int status = result.StatusCode > 0 ? result.StatusCode : StatusCodes.Status500InternalServerError;
        return controller.Problem(statusCode: status, detail: result.Message ?? fallbackDetail);
    }

    internal static ActionResult ToUserCommandProblem(
        this ControllerBase controller,
        UserCommandResult result,
        string fallbackDetail)
    {
        int status = result.FailureReason switch
        {
            UserCommandFailureReason.InvalidRequest       => StatusCodes.Status400BadRequest,
            UserCommandFailureReason.Forbidden            => StatusCodes.Status403Forbidden,
            UserCommandFailureReason.NotFound             => StatusCodes.Status404NotFound,
            UserCommandFailureReason.InvalidStatus        => StatusCodes.Status422UnprocessableEntity,
            UserCommandFailureReason.RoleResolutionFailed => StatusCodes.Status400BadRequest,
            UserCommandFailureReason.PersistenceFailed    => StatusCodes.Status500InternalServerError,
            _ => StatusCodes.Status500InternalServerError
        };
        return controller.Problem(statusCode: status, detail: result.Message ?? fallbackDetail);
    }

    internal static ActionResult ToUserExistsQueryProblem(
        this ControllerBase controller,
        UserExistsQueryResult result,
        string fallbackDetail)
    {
        int status = result.StatusCode > 0 ? result.StatusCode : StatusCodes.Status500InternalServerError;
        return controller.Problem(statusCode: status, detail: result.Message ?? fallbackDetail);
    }
}
