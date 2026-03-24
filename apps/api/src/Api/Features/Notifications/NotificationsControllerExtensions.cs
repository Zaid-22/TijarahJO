using Microsoft.AspNetCore.Mvc;
using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Api.Features.Notifications;

internal static class NotificationsControllerExtensions
{
    internal static ActionResult ToNotificationListQueryProblem(
        this ControllerBase controller,
        NotificationListQueryResult result,
        string fallbackDetail)
    {
        int status = result.StatusCode > 0 ? result.StatusCode : StatusCodes.Status500InternalServerError;
        return controller.Problem(statusCode: status, detail: result.Message ?? fallbackDetail);
    }

    internal static ActionResult ToNotificationUnreadCountQueryProblem(
        this ControllerBase controller,
        NotificationUnreadCountQueryResult result,
        string fallbackDetail)
    {
        int status = result.StatusCode > 0 ? result.StatusCode : StatusCodes.Status500InternalServerError;
        return controller.Problem(statusCode: status, detail: result.Message ?? fallbackDetail);
    }

    internal static ActionResult ToNotificationMutationQueryProblem(
        this ControllerBase controller,
        NotificationMutationQueryResult result,
        string fallbackDetail)
    {
        int status = result.StatusCode > 0 ? result.StatusCode : StatusCodes.Status500InternalServerError;
        return controller.Problem(statusCode: status, detail: result.Message ?? fallbackDetail);
    }
}
