using Microsoft.AspNetCore.Mvc;
using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Api.Features.Categories;

internal static class CategoryControllerExtensions
{
    internal static ActionResult ToCategoryListQueryProblem(
        this ControllerBase controller,
        CategoryListQueryResult result,
        string fallbackDetail)
    {
        int status = result.StatusCode > 0 ? result.StatusCode : StatusCodes.Status500InternalServerError;
        return controller.Problem(statusCode: status, detail: result.Message ?? fallbackDetail);
    }

    internal static ActionResult ToCategoryByIdQueryProblem(
        this ControllerBase controller,
        CategoryByIdQueryResult result,
        string fallbackDetail)
    {
        int status = result.StatusCode > 0 ? result.StatusCode : StatusCodes.Status500InternalServerError;
        return controller.Problem(statusCode: status, detail: result.Message ?? fallbackDetail);
    }

    internal static ActionResult ToCategoryCommandProblem(
        this ControllerBase controller,
        CategoryCommandResult result,
        string fallbackDetail)
    {
        int status = result.FailureReason switch
        {
            CategoryCommandFailureReason.NotFound       => StatusCodes.Status404NotFound,
            CategoryCommandFailureReason.InvalidRequest => StatusCodes.Status400BadRequest,
            CategoryCommandFailureReason.PersistenceFailed => StatusCodes.Status500InternalServerError,
            _ => StatusCodes.Status500InternalServerError
        };
        return controller.Problem(statusCode: status, detail: result.Message ?? fallbackDetail);
    }

    internal static ActionResult ToCategoryExistsQueryProblem(
        this ControllerBase controller,
        CategoryExistsQueryResult result,
        string fallbackDetail)
    {
        int status = result.StatusCode > 0 ? result.StatusCode : StatusCodes.Status500InternalServerError;
        return controller.Problem(statusCode: status, detail: result.Message ?? fallbackDetail);
    }
}
