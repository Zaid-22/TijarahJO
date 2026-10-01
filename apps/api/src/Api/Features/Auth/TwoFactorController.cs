using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Common;
using TijarahJo.Api.Common.Services;
using TijarahJo.Api.Common.Utils;
using TijarahJo.Api.Contracts.Requests;
using TijarahJo.Api.Contracts.Responses;

namespace TijarahJo.Api.Features.Auth;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/auth/2fa")]
public class TwoFactorController(
    TwoFactorService twoFactorService,
    IUserDataAccess users,
    ITokenService tokenService,
    IRoleService roles,
    IUserPermissionService userPermissionService,
    IEmailTwoFactorSender emailSender,
    ILogger<TwoFactorController> logger) : ControllerBase
{
    private readonly TwoFactorService _twoFactorService = twoFactorService;
    private readonly IUserDataAccess _users = users;
    private readonly ITokenService _tokenService = tokenService;
    private readonly IRoleService _roles = roles;
    private readonly IUserPermissionService _userPermissionService = userPermissionService;
    private readonly IEmailTwoFactorSender _emailSender = emailSender;
    private readonly ILogger<TwoFactorController> _logger = logger;

    [HttpPost("verify-login")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<AuthResponse>> VerifyLoginTwoFactor(
        [FromBody] VerifyTwoFactorLoginRequest request,
        CancellationToken cancellationToken)
    {
        if (!_twoFactorService.TryValidateLoginChallengeToken(
                request?.TwoFactorToken,
                DateTimeOffset.UtcNow,
                out int userId,
                out string challengeFailureMessage))
        {
            return Problem(statusCode: StatusCodes.Status401Unauthorized, detail: challengeFailureMessage);
        }

        UserModel? user = await _users.GetUserByIDAsync(userId, cancellationToken);
        if (!AuthShared.IsActiveUser(user))
        {
            return Problem(statusCode: StatusCodes.Status401Unauthorized, detail: "User is not available for authentication.");
        }

        if (!user!.TwoFactorEnabled || string.IsNullOrWhiteSpace(user.TwoFactorSecret))
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Two-factor authentication is not enabled for this account.");
        }

        if (!await _twoFactorService.VerifyLoginCodeAsync(user.UserID!.Value, request?.Code, cancellationToken))
        {
            return Problem(statusCode: StatusCodes.Status401Unauthorized, detail: "Invalid or expired verification code.");
        }

        string? roleName = await AuthShared.ResolveRoleNameForTokenAsync(_roles, user.RoleID, cancellationToken);
        if (string.IsNullOrWhiteSpace(roleName))
        {
            return Problem(statusCode: StatusCodes.Status500InternalServerError, detail: "Unable to resolve user role for authentication.");
        }

        UserPermissionSnapshot permissionSnapshot = await _userPermissionService.GetUserPermissionSnapshotAsync(
            user.UserID!.Value,
            cancellationToken);

        return Ok(AuthShared.CreateAuthenticatedResponse(
            _tokenService,
            Response,
            user,
            roleName,
            permissionSnapshot));
    }

    [HttpGet("challenge")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<AuthResponse> GetTwoFactorChallengeToken()
    {
        string? challengeToken = Request.Cookies["tj-2fa-challenge"];
        if (string.IsNullOrWhiteSpace(challengeToken))
        {
            return NotFound(new ApiMessageResponse { Message = "No pending two-factor challenge found." });
        }

        AuthShared.DeleteCookie(Response, "tj-2fa-challenge");

        return Ok(new AuthResponse
        {
            Success = true,
            RequiresTwoFactor = true,
            TwoFactorToken = challengeToken,
            Message = "Two-factor verification is required."
        });
    }

    [HttpGet("status")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<TwoFactorStatusResponse>> GetTwoFactorStatus(CancellationToken cancellationToken)
    {
        if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int userId, out ActionResult? failureResult))
        {
            return failureResult!;
        }

        UserModel? user = await _users.GetUserByIDAsync(userId, cancellationToken);
        if (!AuthShared.IsActiveUser(user))
        {
            return Problem(statusCode: StatusCodes.Status401Unauthorized, detail: "User not found or inactive.");
        }

        return Ok(new TwoFactorStatusResponse
        {
            Enabled = user!.TwoFactorEnabled,
            HasPendingSetup = !string.IsNullOrWhiteSpace(user.TwoFactorPendingSecret)
        });
    }

    [HttpPost("setup/start")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<TwoFactorSetupStartResponse>> StartTwoFactorSetup(CancellationToken cancellationToken)
    {
        if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int userId, out ActionResult? failureResult))
        {
            return failureResult!;
        }

        UserModel? user = await _users.GetUserByIDAsync(userId, cancellationToken);
        if (!AuthShared.IsActiveUser(user))
        {
            return Problem(statusCode: StatusCodes.Status401Unauthorized, detail: "User not found or inactive.");
        }

        if (user!.TwoFactorEnabled)
        {
            string disableCode = await _twoFactorService.GenerateAndStoreSetupCodeAsync(user.UserID!.Value, cancellationToken);

            EmailTwoFactorSendResult sendResult = await _emailSender.SendTwoFactorCodeAsync(
                user.Email,
                user.FirstName,
                disableCode,
                TimeSpan.FromSeconds(900),
                cancellationToken
            );

            if (!sendResult.Delivered)
            {
                _logger.LogWarning(
                    "[2FA] Failed to send disable code email to {Email}: {FailureMessage}",
                    user.Email,
                    sendResult.FailureMessage
                );
                return Problem(
                    statusCode: StatusCodes.Status503ServiceUnavailable,
                    detail: sendResult.FailureMessage ?? "Two-factor email could not be sent."
                );
            }

            if (_logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation("[2FA] Disable code email sent to {Email}", user.Email);
            }
            if (sendResult.DebugCode is { Length: > 0 } && _logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation("[2FA] Disable code debug fallback active for {Email}: {DebugCode}", user.Email, sendResult.DebugCode);
            }

            return Ok(new TwoFactorSetupStartResponse
            {
                Success = true,
                SecretKey = "",
                OtpAuthUri = "",
                Message = BuildTwoFactorPromptMessage(
                    "A verification code has been sent to your email to confirm this action.",
                    sendResult.DebugCode
                )
            });
        }

        string code = await _twoFactorService.GenerateAndStoreSetupCodeAsync(user.UserID!.Value, cancellationToken);

        EmailTwoFactorSendResult setupSendResult = await _emailSender.SendTwoFactorCodeAsync(
            user.Email,
            user.FirstName,
            code,
            TimeSpan.FromSeconds(900),
            cancellationToken
        );

        if (!setupSendResult.Delivered)
        {
            _logger.LogWarning(
                "[2FA] Failed to send setup code email to {Email}: {FailureMessage}",
                user.Email,
                setupSendResult.FailureMessage
            );
            return Problem(
                statusCode: StatusCodes.Status503ServiceUnavailable,
                detail: setupSendResult.FailureMessage ?? "Two-factor email could not be sent."
            );
        }

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation("[2FA] Setup code email sent to {Email}", user.Email);
        }
        if (setupSendResult.DebugCode is { Length: > 0 } && _logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation("[2FA] Setup code debug fallback active for {Email}: {DebugCode}", user.Email, setupSendResult.DebugCode);
        }

        user = user with { TwoFactorPendingSecret = "PENDING_EMAIL_SETUP" }; // Just a marker
        bool persisted = await _users.UpdateUserFieldsAsync(
            user,
            userId,
            UserUpdateFields.TwoFactorPendingSecret,
            cancellationToken);
        if (!persisted)
        {
            return Problem(statusCode: StatusCodes.Status500InternalServerError, detail: "Failed to start two-factor setup.");
        }

        return Ok(new TwoFactorSetupStartResponse
        {
            Success = true,
            SecretKey = "",
            OtpAuthUri = "",
            Message = BuildTwoFactorPromptMessage(
                "A verification code has been sent to your email. Please enter it to confirm.",
                setupSendResult.DebugCode
            )
        });
    }

    [HttpPost("setup/confirm")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiMessageResponse>> ConfirmTwoFactorSetup(
        [FromBody] TwoFactorCodeRequest request,
        CancellationToken cancellationToken)
    {
        if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int userId, out ActionResult? failureResult))
        {
            return failureResult!;
        }

        UserModel? user = await _users.GetUserByIDAsync(userId, cancellationToken);
        if (!AuthShared.IsActiveUser(user))
        {
            return Problem(statusCode: StatusCodes.Status401Unauthorized, detail: "User not found or inactive.");
        }

        if (string.IsNullOrWhiteSpace(user!.TwoFactorPendingSecret))
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "No pending two-factor setup exists.");
        }

        if (!await _twoFactorService.VerifySetupCodeAsync(user.UserID!.Value, request?.Code, cancellationToken))
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Invalid or expired verification code.");
        }

        user = user with
        {
            TwoFactorSecret = user.TwoFactorPendingSecret,
            TwoFactorPendingSecret = null,
            TwoFactorEnabled = true
        };

        bool persisted = await _users.UpdateUserFieldsAsync(
            user,
            userId,
            UserUpdateFields.TwoFactorEnabled |
            UserUpdateFields.TwoFactorSecret |
            UserUpdateFields.TwoFactorPendingSecret,
            cancellationToken);
        if (!persisted)
        {
            return Problem(statusCode: StatusCodes.Status500InternalServerError, detail: "Failed to enable two-factor authentication.");
        }

        return Ok(new ApiMessageResponse
        {
            Message = "Two-factor authentication has been enabled."
        });
    }

    [HttpPost("disable")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiMessageResponse>> DisableTwoFactor(
        [FromBody] TwoFactorCodeRequest request,
        CancellationToken cancellationToken)
    {
        if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int userId, out ActionResult? failureResult))
        {
            return failureResult!;
        }

        UserModel? user = await _users.GetUserByIDAsync(userId, cancellationToken);
        if (!AuthShared.IsActiveUser(user))
        {
            return Problem(statusCode: StatusCodes.Status401Unauthorized, detail: "User not found or inactive.");
        }

        if (!user!.TwoFactorEnabled || string.IsNullOrWhiteSpace(user.TwoFactorSecret))
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Two-factor authentication is not enabled.");
        }

        // Require verification to disable
        if (!await _twoFactorService.VerifySetupCodeAsync(user.UserID!.Value, request?.Code, cancellationToken))
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Invalid or expired verification code.");
        }

        user = user with
        {
            TwoFactorEnabled = false,
            TwoFactorSecret = null,
            TwoFactorPendingSecret = null
        };

        bool persisted = await _users.UpdateUserFieldsAsync(
            user,
            userId,
            UserUpdateFields.TwoFactorEnabled |
            UserUpdateFields.TwoFactorSecret |
            UserUpdateFields.TwoFactorPendingSecret,
            cancellationToken);
        if (!persisted)
        {
            return Problem(statusCode: StatusCodes.Status500InternalServerError, detail: "Failed to disable two-factor authentication.");
        }

        return Ok(new ApiMessageResponse
        {
            Message = "Two-factor authentication has been disabled."
        });
    }

    private static string BuildTwoFactorPromptMessage(string message, string? _)
    {
        return message;
    }
}
