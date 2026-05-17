using System.Reflection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.WebUtilities;

namespace TijarahJo.Api.Common.Filters;

/// <summary>
/// Normalizes non-success object/status responses into RFC7807 ProblemDetails payloads.
/// </summary>
public sealed class ProblemDetailsResultFilter : IAsyncAlwaysRunResultFilter
{
    public async Task OnResultExecutionAsync(ResultExecutingContext context, ResultExecutionDelegate next)
    {
        context.Result = ConvertIfNeeded(context, context.Result);
        await next();
    }

    private static IActionResult ConvertIfNeeded(ResultExecutingContext context, IActionResult result) => result switch
    {
        ObjectResult objectResult => ConvertObjectResult(context, objectResult),
        StatusCodeResult statusCodeResult when statusCodeResult.StatusCode >= 400 => CreateProblemObjectResult(
            context.HttpContext,
            statusCodeResult.StatusCode,
            detail: null
        ),
        _ => result
    };

    private static ObjectResult ConvertObjectResult(ResultExecutingContext context, ObjectResult objectResult)
    {
        int statusCode = objectResult.StatusCode ?? context.HttpContext.Response.StatusCode;
        if (statusCode < 400)
        {
            return objectResult;
        }

        if (objectResult.Value is ProblemDetails or ValidationProblemDetails)
        {
            return objectResult;
        }

        string? detail = TryExtractDetail(objectResult.Value);
        return CreateProblemObjectResult(context.HttpContext, statusCode, detail);
    }

    private static ObjectResult CreateProblemObjectResult(HttpContext httpContext, int statusCode, string? detail)
    {
        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = ReasonPhrases.GetReasonPhrase(statusCode),
            Detail = string.IsNullOrWhiteSpace(detail) ? null : detail,
            Type = $"https://httpstatuses.com/{statusCode}",
            Instance = httpContext.Request.Path
        };
        problemDetails.Extensions["traceId"] = httpContext.TraceIdentifier;

        return new ObjectResult(problemDetails)
        {
            StatusCode = statusCode,
            ContentTypes = { "application/problem+json" }
        };
    }

    private static string? TryExtractDetail(object? value)
    {
        if (value == null)
        {
            return null;
        }

        if (value is string text)
        {
            return text;
        }

        if (value is ProblemDetails problemDetails)
        {
            return problemDetails.Detail;
        }

        const BindingFlags flags =
            BindingFlags.Instance |
            BindingFlags.Public |
            BindingFlags.IgnoreCase;

        PropertyInfo? messageProperty = value.GetType().GetProperty("message", flags);
        if (messageProperty?.GetValue(value) is string message && !string.IsNullOrWhiteSpace(message))
        {
            return message;
        }

        return null;
    }
}
