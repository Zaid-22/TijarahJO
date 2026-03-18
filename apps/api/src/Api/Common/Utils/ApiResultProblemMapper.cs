using Microsoft.AspNetCore.Mvc;
using TijarahJoDB.Application.Abstractions.Services;

namespace TijarahJo.Api.Common.Utils;

public static class ApiResultProblemMapper
{
    private static ActionResult ToStatusCodeProblem(this ControllerBase controller, int statusCode, string? message, string fallbackDetail)
    {
        int normalizedStatusCode = statusCode switch
        {
            StatusCodes.Status400BadRequest => StatusCodes.Status400BadRequest,
            StatusCodes.Status401Unauthorized => StatusCodes.Status401Unauthorized,
            StatusCodes.Status403Forbidden => StatusCodes.Status403Forbidden,
            StatusCodes.Status404NotFound => StatusCodes.Status404NotFound,
            StatusCodes.Status409Conflict => StatusCodes.Status409Conflict,
            StatusCodes.Status422UnprocessableEntity => StatusCodes.Status422UnprocessableEntity,
            StatusCodes.Status429TooManyRequests => StatusCodes.Status429TooManyRequests,
            StatusCodes.Status500InternalServerError => StatusCodes.Status500InternalServerError,
            StatusCodes.Status503ServiceUnavailable => StatusCodes.Status503ServiceUnavailable,
            _ => StatusCodes.Status500InternalServerError
        };

        return controller.Problem(
            statusCode: normalizedStatusCode,
            detail: string.IsNullOrWhiteSpace(message) ? fallbackDetail : message
        );
    }

    public static ActionResult ToChatProblem<T>(this ControllerBase controller, ChatServiceResult<T> result, string fallbackDetail)
    {
        return result.FailureReason switch
        {
            ChatFailureReason.InvalidRequest => controller.Problem(statusCode: StatusCodes.Status400BadRequest, detail: result.Message),
            ChatFailureReason.NotFound => controller.Problem(statusCode: StatusCodes.Status404NotFound, detail: result.Message),
            ChatFailureReason.Forbidden => controller.Problem(statusCode: StatusCodes.Status403Forbidden, detail: result.Message),
            _ => controller.Problem(statusCode: StatusCodes.Status500InternalServerError, detail: result.Message ?? fallbackDetail)
        };
    }

    public static ActionResult ToSellerProfileProblem(this ControllerBase controller, SellerProfileResult result, string fallbackDetail)
    {
        return result.FailureReason switch
        {
            SellerProfileFailureReason.InvalidRequest => controller.Problem(statusCode: StatusCodes.Status400BadRequest, detail: result.Message),
            SellerProfileFailureReason.NotFound => controller.Problem(statusCode: StatusCodes.Status404NotFound, detail: result.Message),
            _ => controller.Problem(statusCode: StatusCodes.Status500InternalServerError, detail: result.Message ?? fallbackDetail)
        };
    }

    public static ActionResult ToTopSellersProblem(this ControllerBase controller, TopSellersResult result, string fallbackDetail)
    {
        return result.FailureReason switch
        {
            SellerProfileFailureReason.InvalidRequest => controller.Problem(statusCode: StatusCodes.Status400BadRequest, detail: result.Message),
            _ => controller.Problem(statusCode: StatusCodes.Status500InternalServerError, detail: result.Message ?? fallbackDetail)
        };
    }

    public static ActionResult ToUserCommandProblem(this ControllerBase controller, UserCommandResult result, string fallbackDetail)
    {
        return result.FailureReason switch
        {
            UserCommandFailureReason.InvalidRequest => controller.Problem(statusCode: StatusCodes.Status400BadRequest, detail: result.Message),
            UserCommandFailureReason.InvalidStatus => controller.Problem(statusCode: StatusCodes.Status400BadRequest, detail: result.Message),
            UserCommandFailureReason.Forbidden => controller.Problem(statusCode: StatusCodes.Status403Forbidden, detail: result.Message),
            UserCommandFailureReason.NotFound => controller.Problem(statusCode: StatusCodes.Status404NotFound, detail: result.Message),
            UserCommandFailureReason.RoleResolutionFailed => controller.Problem(statusCode: StatusCodes.Status500InternalServerError, detail: result.Message),
            UserCommandFailureReason.PersistenceFailed => controller.Problem(statusCode: StatusCodes.Status500InternalServerError, detail: result.Message),
            _ => controller.Problem(statusCode: StatusCodes.Status500InternalServerError, detail: fallbackDetail)
        };
    }

    public static ActionResult ToPostImageCommandProblem(this ControllerBase controller, PostImageCommandResult result, string fallbackDetail)
    {
        return result.FailureReason switch
        {
            PostImageCommandFailureReason.InvalidRequest => controller.Problem(statusCode: StatusCodes.Status400BadRequest, detail: result.Message),
            PostImageCommandFailureReason.PostDeleted => controller.Problem(statusCode: StatusCodes.Status400BadRequest, detail: result.Message),
            PostImageCommandFailureReason.CrossPostMoveNotAllowed => controller.Problem(statusCode: StatusCodes.Status400BadRequest, detail: result.Message),
            PostImageCommandFailureReason.PostNotFound => controller.Problem(statusCode: StatusCodes.Status404NotFound, detail: result.Message),
            PostImageCommandFailureReason.PostImageNotFound => controller.Problem(statusCode: StatusCodes.Status404NotFound, detail: result.Message),
            PostImageCommandFailureReason.Forbidden => controller.Problem(statusCode: StatusCodes.Status403Forbidden, detail: result.Message),
            _ => controller.Problem(statusCode: StatusCodes.Status500InternalServerError, detail: result.Message ?? fallbackDetail)
        };
    }

    public static ActionResult ToPostMutationProblem(this ControllerBase controller, PostMutationResult result, string fallbackDetail)
    {
        return result.FailureReason switch
        {
            PostMutationFailureReason.InvalidRequest => controller.Problem(statusCode: StatusCodes.Status400BadRequest, detail: result.Message),
            PostMutationFailureReason.Unauthorized => controller.Problem(statusCode: StatusCodes.Status401Unauthorized, detail: result.Message),
            PostMutationFailureReason.Forbidden => controller.Problem(statusCode: StatusCodes.Status403Forbidden, detail: result.Message),
            PostMutationFailureReason.NotFound => controller.Problem(statusCode: StatusCodes.Status404NotFound, detail: result.Message),
            PostMutationFailureReason.InvalidStatus => controller.Problem(statusCode: StatusCodes.Status400BadRequest, detail: result.Message),
            PostMutationFailureReason.PersistenceFailed => controller.Problem(statusCode: StatusCodes.Status500InternalServerError, detail: result.Message),
            _ => controller.Problem(statusCode: StatusCodes.Status500InternalServerError, detail: fallbackDetail)
        };
    }

    public static ActionResult ToPostStatusProblem(this ControllerBase controller, PostStatusUpdateResult result, string fallbackDetail)
    {
        if (string.IsNullOrWhiteSpace(result.Message))
        {
            return controller.Problem(statusCode: StatusCodes.Status500InternalServerError, detail: fallbackDetail);
        }

        return result.FailureReason switch
        {
            PostStatusUpdateFailureReason.InvalidRequest => controller.Problem(statusCode: StatusCodes.Status400BadRequest, detail: result.Message),
            PostStatusUpdateFailureReason.InvalidStatus => controller.Problem(statusCode: StatusCodes.Status400BadRequest, detail: result.Message),
            PostStatusUpdateFailureReason.PostNotFound => controller.Problem(statusCode: StatusCodes.Status404NotFound, detail: result.Message),
            PostStatusUpdateFailureReason.Forbidden => controller.Problem(statusCode: StatusCodes.Status403Forbidden, detail: result.Message),
            PostStatusUpdateFailureReason.PersistenceFailed => controller.Problem(statusCode: StatusCodes.Status500InternalServerError, detail: result.Message),
            _ => controller.Problem(statusCode: StatusCodes.Status500InternalServerError, detail: fallbackDetail)
        };
    }

    public static ActionResult ToSearchQueryProblem(this ControllerBase controller, SearchQueryResult result, string fallbackDetail)
        => controller.ToStatusCodeProblem(result.StatusCode, result.Message, fallbackDetail);

    public static ActionResult ToFavoriteListQueryProblem(this ControllerBase controller, FavoriteListQueryResult result, string fallbackDetail)
        => controller.ToStatusCodeProblem(result.StatusCode, result.Message, fallbackDetail);

    public static ActionResult ToFavoriteOperationQueryProblem(this ControllerBase controller, FavoriteOperationQueryResult result, string fallbackDetail)
        => controller.ToStatusCodeProblem(result.StatusCode, result.Message, fallbackDetail);

    public static ActionResult ToNotificationListQueryProblem(this ControllerBase controller, NotificationListQueryResult result, string fallbackDetail)
        => controller.ToStatusCodeProblem(result.StatusCode, result.Message, fallbackDetail);

    public static ActionResult ToNotificationUnreadCountQueryProblem(this ControllerBase controller, NotificationUnreadCountQueryResult result, string fallbackDetail)
        => controller.ToStatusCodeProblem(result.StatusCode, result.Message, fallbackDetail);

    public static ActionResult ToNotificationMutationQueryProblem(this ControllerBase controller, NotificationMutationQueryResult result, string fallbackDetail)
        => controller.ToStatusCodeProblem(result.StatusCode, result.Message, fallbackDetail);

    public static ActionResult ToUserListQueryProblem(this ControllerBase controller, UserListQueryResult result, string fallbackDetail)
        => controller.ToStatusCodeProblem(result.StatusCode, result.Message, fallbackDetail);

    public static ActionResult ToUserByIdQueryProblem(this ControllerBase controller, UserByIdQueryResult result, string fallbackDetail)
        => controller.ToStatusCodeProblem(result.StatusCode, result.Message, fallbackDetail);

    public static ActionResult ToUserExistsQueryProblem(this ControllerBase controller, UserExistsQueryResult result, string fallbackDetail)
        => controller.ToStatusCodeProblem(result.StatusCode, result.Message, fallbackDetail);

    public static ActionResult ToPostImageListQueryProblem(this ControllerBase controller, PostImageListQueryResult result, string fallbackDetail)
        => controller.ToStatusCodeProblem(result.StatusCode, result.Message, fallbackDetail);

    public static ActionResult ToPostImageByIdQueryProblem(this ControllerBase controller, PostImageByIdQueryResult result, string fallbackDetail)
        => controller.ToStatusCodeProblem(result.StatusCode, result.Message, fallbackDetail);

    public static ActionResult ToPostImageExistsQueryProblem(this ControllerBase controller, PostImageExistsQueryResult result, string fallbackDetail)
        => controller.ToStatusCodeProblem(result.StatusCode, result.Message, fallbackDetail);

    public static ActionResult ToCategoryCommandProblem(this ControllerBase controller, CategoryCommandResult result, string fallbackDetail)
    {
        return result.FailureReason switch
        {
            CategoryCommandFailureReason.InvalidRequest => controller.Problem(statusCode: StatusCodes.Status400BadRequest, detail: result.Message),
            CategoryCommandFailureReason.NotFound => controller.Problem(statusCode: StatusCodes.Status404NotFound, detail: result.Message),
            _ => controller.Problem(statusCode: StatusCodes.Status500InternalServerError, detail: result.Message ?? fallbackDetail)
        };
    }

    public static ActionResult ToCategoryListQueryProblem(this ControllerBase controller, CategoryListQueryResult result, string fallbackDetail)
        => controller.ToStatusCodeProblem(result.StatusCode, result.Message, fallbackDetail);

    public static ActionResult ToCategoryByIdQueryProblem(this ControllerBase controller, CategoryByIdQueryResult result, string fallbackDetail)
        => controller.ToStatusCodeProblem(result.StatusCode, result.Message, fallbackDetail);

    public static ActionResult ToCategoryExistsQueryProblem(this ControllerBase controller, CategoryExistsQueryResult result, string fallbackDetail)
        => controller.ToStatusCodeProblem(result.StatusCode, result.Message, fallbackDetail);

    public static ActionResult ToRoleCommandProblem(this ControllerBase controller, RoleCommandResult result, string fallbackDetail)
    {
        return result.FailureReason switch
        {
            RoleCommandFailureReason.InvalidRequest => controller.Problem(statusCode: StatusCodes.Status400BadRequest, detail: result.Message),
            RoleCommandFailureReason.NotFound => controller.Problem(statusCode: StatusCodes.Status404NotFound, detail: result.Message),
            _ => controller.Problem(statusCode: StatusCodes.Status500InternalServerError, detail: result.Message ?? fallbackDetail)
        };
    }

    public static ActionResult ToRoleListQueryProblem(this ControllerBase controller, RoleListQueryResult result, string fallbackDetail)
        => controller.ToStatusCodeProblem(result.StatusCode, result.Message, fallbackDetail);

    public static ActionResult ToRoleByIdQueryProblem(this ControllerBase controller, RoleByIdQueryResult result, string fallbackDetail)
        => controller.ToStatusCodeProblem(result.StatusCode, result.Message, fallbackDetail);

    public static ActionResult ToRoleExistsQueryProblem(this ControllerBase controller, RoleExistsQueryResult result, string fallbackDetail)
        => controller.ToStatusCodeProblem(result.StatusCode, result.Message, fallbackDetail);

    public static ActionResult ToPostReadProblem(
        this ControllerBase controller,
        PostReadFailureReason? failureReason,
        string? message,
        string fallbackDetail)
    {
        return failureReason switch
        {
            PostReadFailureReason.InvalidRequest => controller.Problem(statusCode: StatusCodes.Status400BadRequest, detail: message),
            PostReadFailureReason.NotFound => controller.Problem(statusCode: StatusCodes.Status404NotFound, detail: message),
            PostReadFailureReason.PersistenceFailed => controller.Problem(statusCode: StatusCodes.Status500InternalServerError, detail: message),
            _ => controller.Problem(statusCode: StatusCodes.Status500InternalServerError, detail: fallbackDetail)
        };
    }
}
