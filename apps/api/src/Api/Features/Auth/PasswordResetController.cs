using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TijarahJoDBAPI.Common.Services;
using TijarahJoDBAPI.Contracts.Requests;
using TijarahJoDBAPI.Contracts.Responses;

namespace TijarahJoDBAPI.Features.Auth;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/auth/forgot-password")]
public class PasswordResetController : ControllerBase
{
    private readonly IPasswordResetService _passwordResetService;

    public PasswordResetController(IPasswordResetService passwordResetService)
    {
        _passwordResetService = passwordResetService;
    }

    [HttpPost("request")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiMessageResponse>> RequestPasswordReset(
        [FromBody] ForgotPasswordRequest request,
        CancellationToken cancellationToken)
    {
        await _passwordResetService.RequestResetAsync(request?.Email, cancellationToken);

        return Ok(new ApiMessageResponse
        {
            Message = "If an account exists for that email, a verification code has been sent."
        });
    }

    [HttpPost("confirm")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<ApiMessageResponse>> ConfirmPasswordReset(
        [FromBody] ConfirmPasswordResetRequest request,
        CancellationToken cancellationToken)
    {
        PasswordResetConfirmationResult result = await _passwordResetService.ConfirmResetAsync(
            request?.Email,
            request?.Code,
            request?.NewPassword,
            cancellationToken
        );

        if (!result.Success)
        {
            return result.FailureReason switch
            {
                PasswordResetConfirmationFailureReason.InvalidRequest => Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    detail: result.Message
                ),
                PasswordResetConfirmationFailureReason.PasswordPolicyViolation => Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    detail: result.Message
                ),
                PasswordResetConfirmationFailureReason.InvalidOrExpiredCode => Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    detail: result.Message
                ),
                PasswordResetConfirmationFailureReason.TooManyAttempts => Problem(
                    statusCode: StatusCodes.Status429TooManyRequests,
                    detail: result.Message
                ),
                PasswordResetConfirmationFailureReason.UserUnavailable => Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    detail: result.Message
                ),
                PasswordResetConfirmationFailureReason.PersistenceFailed => Problem(
                    statusCode: StatusCodes.Status500InternalServerError,
                    detail: result.Message
                ),
                _ => Problem(
                    statusCode: StatusCodes.Status500InternalServerError,
                    detail: "Failed to reset password."
                )
            };
        }

        return Ok(new ApiMessageResponse
        {
            Message = "Password has been reset successfully. You can now sign in with your new password."
        });
    }
}
