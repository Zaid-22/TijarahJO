using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TijarahJo.Domain.Models;
using TijarahJoDB.Application.Abstractions.DataAccess;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.Application.Common;
using TijarahJoDBAPI.Common.Services;
using TijarahJoDBAPI.Common.Utils;
using TijarahJoDBAPI.Contracts.Requests;
using TijarahJoDBAPI.Contracts.Responses;

namespace TijarahJoDBAPI.Features.Auth;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/auth/2fa")]
public class TwoFactorController : ControllerBase
{
    private readonly TwoFactorService _twoFactorService;
    private readonly IUserDataAccess _users;
    private readonly ITokenService _tokenService;
    private readonly IRoleService _roles;
    private readonly ILogger<TwoFactorController> _logger;

    public TwoFactorController(
        TwoFactorService twoFactorService,
        IUserDataAccess users,
        ITokenService tokenService,
        IRoleService roles,
        ILogger<TwoFactorController> logger)
    {
        _twoFactorService = twoFactorService;
        _users = users;
        _tokenService = tokenService;
        _roles = roles;
        _logger = logger;
    }

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

        if (!_twoFactorService.TryUnprotectSecret(user.TwoFactorSecret, out string rawSecret))
        {
            _logger.LogWarning("Failed to decrypt TOTP secret during login verification. userId={UserId}", user.UserID);
            return Problem(statusCode: StatusCodes.Status500InternalServerError, detail: "Two-factor secret is unavailable. Please reset 2FA from settings.");
        }

        if (!_twoFactorService.VerifyCode(rawSecret, request?.Code, DateTimeOffset.UtcNow))
        {
            return Problem(statusCode: StatusCodes.Status401Unauthorized, detail: "Invalid verification code.");
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
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Two-factor authentication is already enabled.");
        }

        string secretKey = _twoFactorService.GenerateSecretKey();
        string protectedSecret = _twoFactorService.ProtectSecret(secretKey);
        string otpAuthUri = _twoFactorService.BuildOtpAuthUri(user.Email, secretKey);

        user.TwoFactorPendingSecret = protectedSecret;
        bool persisted = await _users.UpdateUserAsync(user, userId, cancellationToken);
        if (!persisted)
        {
            return Problem(statusCode: StatusCodes.Status500InternalServerError, detail: "Failed to start two-factor setup.");
        }

        return Ok(new TwoFactorSetupStartResponse
        {
            Success = true,
            SecretKey = secretKey,
            OtpAuthUri = otpAuthUri,
            Message = "Scan the QR code URI or enter the secret key in your authenticator app, then confirm with a code."
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

        if (!_twoFactorService.TryUnprotectSecret(user.TwoFactorPendingSecret, out string pendingSecret))
        {
            return Problem(statusCode: StatusCodes.Status500InternalServerError, detail: "Pending two-factor secret is invalid. Start setup again.");
        }

        if (!_twoFactorService.VerifyCode(pendingSecret, request?.Code, DateTimeOffset.UtcNow))
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Invalid verification code.");
        }

        user.TwoFactorSecret = user.TwoFactorPendingSecret;
        user.TwoFactorPendingSecret = null;
        user.TwoFactorEnabled = true;

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

        if (!_twoFactorService.TryUnprotectSecret(user.TwoFactorSecret, out string activeSecret))
        {
            return Problem(statusCode: StatusCodes.Status500InternalServerError, detail: "Two-factor secret is unavailable. Please reconfigure setup.");
        }

        if (!_twoFactorService.VerifyCode(activeSecret, request?.Code, DateTimeOffset.UtcNow))
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Invalid verification code.");
        }

        user.TwoFactorEnabled = false;
        user.TwoFactorSecret = null;
        user.TwoFactorPendingSecret = null;

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
