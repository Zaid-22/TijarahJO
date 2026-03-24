using Microsoft.AspNetCore.Mvc;
using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Api.Features.Roles;

internal static class RolesControllerExtensions
{
    internal static ActionResult ToRoleListQueryProblem(
        this ControllerBase controller,
        RoleListQueryResult result,
        string fallbackDetail)
    {
        int status = result.StatusCode > 0 ? result.StatusCode : StatusCodes.Status500InternalServerError;
        return controller.Problem(statusCode: status, detail: result.Message ?? fallbackDetail);
    }

    internal static ActionResult ToRoleByIdQueryProblem(
        this ControllerBase controller,
        RoleByIdQueryResult result,
        string fallbackDetail)
    {
        int status = result.StatusCode > 0 ? result.StatusCode : StatusCodes.Status500InternalServerError;
        return controller.Problem(statusCode: status, detail: result.Message ?? fallbackDetail);
    }

    internal static ActionResult ToRoleCommandProblem(
        this ControllerBase controller,
        RoleCommandResult result,
        string fallbackDetail)
    {
        int status = result.FailureReason switch
        {
            RoleCommandFailureReason.InvalidRequest    => StatusCodes.Status400BadRequest,
            RoleCommandFailureReason.NotFound          => StatusCodes.Status404NotFound,
            RoleCommandFailureReason.PersistenceFailed => StatusCodes.Status500InternalServerError,
            _ => StatusCodes.Status500InternalServerError
        };
        return controller.Problem(statusCode: status, detail: result.Message ?? fallbackDetail);
    }

    internal static ActionResult ToRoleExistsQueryProblem(
        this ControllerBase controller,
        RoleExistsQueryResult result,
        string fallbackDetail)
    {
        int status = result.StatusCode > 0 ? result.StatusCode : StatusCodes.Status500InternalServerError;
        return controller.Problem(statusCode: status, detail: result.Message ?? fallbackDetail);
    }
}
