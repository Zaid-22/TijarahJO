using Microsoft.AspNetCore.Mvc;
using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Api.Features.Posts;

internal static class UserPostsControllerExtensions
{
    internal static ActionResult ToPostReadProblem(
        this ControllerBase controller,
        PostReadFailureReason? failureReason,
        string? message,
        string fallbackDetail)
    {
        int status = failureReason switch
        {
            PostReadFailureReason.InvalidRequest   => StatusCodes.Status400BadRequest,
            PostReadFailureReason.NotFound         => StatusCodes.Status404NotFound,
            PostReadFailureReason.PersistenceFailed => StatusCodes.Status500InternalServerError,
            _ => StatusCodes.Status500InternalServerError
        };
        return controller.Problem(statusCode: status, detail: message ?? fallbackDetail);
    }

    internal static ActionResult ToPostMutationProblem(
        this ControllerBase controller,
        PostMutationResult result,
        string fallbackDetail)
    {
        int status = result.FailureReason switch
        {
            PostMutationFailureReason.InvalidRequest    => StatusCodes.Status400BadRequest,
            PostMutationFailureReason.Unauthorized      => StatusCodes.Status401Unauthorized,
            PostMutationFailureReason.Forbidden         => StatusCodes.Status403Forbidden,
            PostMutationFailureReason.NotFound          => StatusCodes.Status404NotFound,
            PostMutationFailureReason.InvalidStatus     => StatusCodes.Status422UnprocessableEntity,
            PostMutationFailureReason.PersistenceFailed => StatusCodes.Status500InternalServerError,
            _ => StatusCodes.Status500InternalServerError
        };
        return controller.Problem(statusCode: status, detail: result.Message ?? fallbackDetail);
    }

    internal static ActionResult ToPostStatusProblem(
        this ControllerBase controller,
        PostStatusUpdateResult result,
        string fallbackDetail)
    {
        int status = result.FailureReason switch
        {
            PostStatusUpdateFailureReason.InvalidRequest    => StatusCodes.Status400BadRequest,
            PostStatusUpdateFailureReason.InvalidStatus     => StatusCodes.Status422UnprocessableEntity,
            PostStatusUpdateFailureReason.PostNotFound      => StatusCodes.Status404NotFound,
            PostStatusUpdateFailureReason.Forbidden         => StatusCodes.Status403Forbidden,
            PostStatusUpdateFailureReason.PersistenceFailed => StatusCodes.Status500InternalServerError,
            _ => StatusCodes.Status500InternalServerError
        };
        return controller.Problem(statusCode: status, detail: result.Message ?? fallbackDetail);
    }
}
