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
    IEmailTwoFactorSender emailSender,
    ILogger<TwoFactorController> logger) : ControllerBase
{
    private readonly TwoFactorService _twoFactorService = twoFactorService;
    private readonly IUserDataAccess _users = users;
    private readonly ITokenService _tokenService = tokenService;
    private readonly IRoleService _roles = roles;
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

        if (!_twoFactorService.VerifyLoginCode(user.UserID!.Value, request?.Code))
        {
            return Problem(statusCode: StatusCodes.Status401Unauthorized, detail: "Invalid or expired verification code.");
        }

        string? roleName = await AuthShared.ResolveRoleNameForTokenAsync(_roles, user.RoleID, cancellationToken);
        if (string.IsNullOrWhiteSpace(roleName))
        {
            return Problem(statusCode: StatusCodes.Status500InternalServerError, detail: "Unable to resolve user role for authentication.");
        }

        return Ok(AuthShared.CreateAuthenticatedResponse(_tokenService, Response, user, roleName));
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
            // Instead of blocking, allow generating a code for disabling later
            string disableCode = _twoFactorService.GenerateAndStoreSetupCode(user.UserID!.Value);
            try
            {
                await _emailSender.SendTwoFactorCodeAsync(
                    user.Email,
                    user.FirstName,
                    disableCode,
                    TimeSpan.FromSeconds(900),
                    cancellationToken
                );
                _logger.LogInformation("[2FA] Disable code email sent to {Email}", user.Email);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[2FA] Failed to send disable code email to {Email}", user.Email);
            }
            return Ok(new TwoFactorSetupStartResponse
            {
                Success = true,
                SecretKey = "",
                OtpAuthUri = "",
                Message = "A verification code has been sent to your email to confirm this action."
            });
        }

        string code = _twoFactorService.GenerateAndStoreSetupCode(user.UserID!.Value);

        try
        {
            await _emailSender.SendTwoFactorCodeAsync(
                user.Email,
                user.FirstName,
                code,
                TimeSpan.FromSeconds(900),
                cancellationToken
            );
            _logger.LogInformation("[2FA] Setup code email sent to {Email}", user.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[2FA] Failed to send setup code email to {Email}", user.Email);
        }

        user = user with { TwoFactorPendingSecret = "PENDING_EMAIL_SETUP" }; // Just a marker
        bool persisted = await _users.UpdateUserAsync(user, userId, cancellationToken);
        if (!persisted)
        {
            return Problem(statusCode: StatusCodes.Status500InternalServerError, detail: "Failed to start two-factor setup.");
        }

        return Ok(new TwoFactorSetupStartResponse
        {
            Success = true,
            SecretKey = "",
            OtpAuthUri = "",
            Message = "A verification code has been sent to your email. Please enter it to confirm."
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

        if (!_twoFactorService.VerifySetupCode(user.UserID!.Value, request?.Code))
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Invalid or expired verification code.");
        }

        user = user with
        {
            TwoFactorSecret = user.TwoFactorPendingSecret,
            TwoFactorPendingSecret = null,
            TwoFactorEnabled = true
        };

        bool persisted = await _users.UpdateUserAsync(user, userId, cancellationToken);
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

        // For disabling email 2FA, send a fast setup code and verify it to make sure they own the email?
        // Wait, standard disabling uses an active TOTP code. For email, we should maybe generate a code and ask them to verify it.
        // Or if we just trust the currently logged in user, maybe we don't even need a code?
        // But the UI currently asks for a code to disable. We should issue a disable override code.
        // Actually, we can reuse VerifySetupCode to let them disable if they request it, but
        // since the old flow expects a code from the *existing* TOTP app, here they must request a code.
        // To keep the API simple: just remove 2FA without verifying if they are already logged in, 
        // OR we can make them hit a 'Disable Start' endpoint. Since there isn't one, 
        // let's just bypass the code check or allow it to be disabled instantly by checking if they provided a setup code that we sent?
        // Let's implement a quick disable that accepts any code or none, and simply disables it. 
        // If we strictly follow security, we need to send an email first. 
        // Since we are changing from TOTP, let's just make it simple: they can disable using the regular password or just disable directly.
        // I will change it so we don't verify the code to disable, or we return Ok immediately if they hit this endpoint.
        
        // Actually, let's keep the code signature but ignore it:
        // Or we can verify it using VerifySetupCode, so if they want to disable, they must have requested a code via `setup/start` first!
        // Wait, if they call `setup/start` while 2FA is enabled, it returns 400 BadRequest currently!
        // We will just allow disabling directly if they are logged in.


        // Require verification to disable
        if (!_twoFactorService.VerifySetupCode(user.UserID!.Value, request?.Code))
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Invalid or expired verification code.");
        }

        user = user with
        {
            TwoFactorEnabled = false,
            TwoFactorSecret = null,
            TwoFactorPendingSecret = null
        };

        bool persisted = await _users.UpdateUserAsync(user, userId, cancellationToken);
        if (!persisted)
        {
            return Problem(statusCode: StatusCodes.Status500InternalServerError, detail: "Failed to disable two-factor authentication.");
        }

        return Ok(new ApiMessageResponse
        {
            Message = "Two-factor authentication has been disabled."
        });
    }
}
