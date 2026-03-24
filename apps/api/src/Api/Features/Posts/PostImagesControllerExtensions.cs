using Microsoft.AspNetCore.Mvc;
using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Api.Features.Posts;

internal static class PostImagesControllerExtensions
{
    internal static ActionResult ToPostImageListQueryProblem(
        this ControllerBase controller,
        PostImageListQueryResult result,
        string fallbackDetail)
    {
        int status = result.StatusCode > 0 ? result.StatusCode : StatusCodes.Status500InternalServerError;
        return controller.Problem(statusCode: status, detail: result.Message ?? fallbackDetail);
    }

    internal static ActionResult ToPostImageByIdQueryProblem(
        this ControllerBase controller,
        PostImageByIdQueryResult result,
        string fallbackDetail)
    {
        int status = result.StatusCode > 0 ? result.StatusCode : StatusCodes.Status500InternalServerError;
        return controller.Problem(statusCode: status, detail: result.Message ?? fallbackDetail);
    }

    internal static ActionResult ToPostImageCommandProblem(
        this ControllerBase controller,
        PostImageCommandResult result,
        string fallbackDetail)
    {
        int status = result.FailureReason switch
        {
            PostImageCommandFailureReason.InvalidRequest         => StatusCodes.Status400BadRequest,
            PostImageCommandFailureReason.PostNotFound           => StatusCodes.Status404NotFound,
            PostImageCommandFailureReason.PostDeleted            => StatusCodes.Status404NotFound,
            PostImageCommandFailureReason.PostImageNotFound      => StatusCodes.Status404NotFound,
            PostImageCommandFailureReason.Forbidden              => StatusCodes.Status403Forbidden,
            PostImageCommandFailureReason.CrossPostMoveNotAllowed => StatusCodes.Status400BadRequest,
            PostImageCommandFailureReason.PersistenceFailed      => StatusCodes.Status500InternalServerError,
            _ => StatusCodes.Status500InternalServerError
        };
        return controller.Problem(statusCode: status, detail: result.Message ?? fallbackDetail);
    }

    internal static ActionResult ToPostImageExistsQueryProblem(
        this ControllerBase controller,
        PostImageExistsQueryResult result,
        string fallbackDetail)
    {
        int status = result.StatusCode > 0 ? result.StatusCode : StatusCodes.Status500InternalServerError;
        return controller.Problem(statusCode: status, detail: result.Message ?? fallbackDetail);
    }
}
