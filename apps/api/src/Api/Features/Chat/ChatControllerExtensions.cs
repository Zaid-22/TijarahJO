using Microsoft.AspNetCore.Mvc;
using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Api.Features.Chat;

internal static class ChatControllerExtensions
{
    internal static ActionResult ToChatProblem<T>(
        this ControllerBase controller,
        ChatServiceResult<T> result,
        string fallbackDetail)
    {
        int status = result.FailureReason switch
        {
            ChatFailureReason.InvalidRequest   => StatusCodes.Status400BadRequest,
            ChatFailureReason.NotFound         => StatusCodes.Status404NotFound,
            ChatFailureReason.Forbidden        => StatusCodes.Status403Forbidden,
            ChatFailureReason.PersistenceFailed => StatusCodes.Status500InternalServerError,
            _ => StatusCodes.Status500InternalServerError
        };
        return controller.Problem(statusCode: status, detail: result.Message ?? fallbackDetail);
    }
}
