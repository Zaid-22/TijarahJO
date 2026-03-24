using Microsoft.AspNetCore.Mvc;
using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Api.Features.Sellers;

internal static class SellersControllerExtensions
{
    internal static ActionResult ToSellerProfileProblem(
        this ControllerBase controller,
        SellerProfileResult result,
        string fallbackDetail)
    {
        int status = result.FailureReason switch
        {
            SellerProfileFailureReason.InvalidRequest => StatusCodes.Status400BadRequest,
            SellerProfileFailureReason.NotFound       => StatusCodes.Status404NotFound,
            SellerProfileFailureReason.Unexpected     => StatusCodes.Status500InternalServerError,
            _ => StatusCodes.Status500InternalServerError
        };
        return controller.Problem(statusCode: status, detail: result.Message ?? fallbackDetail);
    }

    internal static ActionResult ToTopSellersProblem(
        this ControllerBase controller,
        TopSellersResult result,
        string fallbackDetail)
    {
        int status = result.FailureReason switch
        {
            SellerProfileFailureReason.InvalidRequest => StatusCodes.Status400BadRequest,
            SellerProfileFailureReason.NotFound       => StatusCodes.Status404NotFound,
            SellerProfileFailureReason.Unexpected     => StatusCodes.Status500InternalServerError,
            _ => StatusCodes.Status500InternalServerError
        };
        return controller.Problem(statusCode: status, detail: result.Message ?? fallbackDetail);
    }
}
