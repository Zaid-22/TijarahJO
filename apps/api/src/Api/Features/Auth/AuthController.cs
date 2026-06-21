using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
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
[Route("api/v{version:apiVersion}/auth")]
public class AuthController(
    ITokenService tokenService,
    IAuthCommandService authCommands,
    IUserQueryHandler userQueries,
    IRoleService roles,
    IUserPermissionService userPermissionService,
    TwoFactorService twoFactorService,
    IEmailTwoFactorSender emailSender,
    ITokenBlacklistService tokenBlacklistService,
    IEmailVerificationService emailVerificationService,
    ILogger<AuthController> logger) : ControllerBase
{
    private readonly ITokenService _tokenService = tokenService;
    private readonly IAuthCommandService _authCommands = authCommands;
    private readonly IUserQueryHandler _userQueries = userQueries;
    private readonly IRoleService _roles = roles;
    private readonly IUserPermissionService _userPermissionService = userPermissionService;
    private readonly TwoFactorService _twoFactorService = twoFactorService;
    private readonly IEmailTwoFactorSender _emailSender = emailSender;
    private readonly ITokenBlacklistService _tokenBlacklistService = tokenBlacklistService;
    private readonly IEmailVerificationService _emailVerificationService = emailVerificationService;
    private readonly ILogger<AuthController> _logger = logger;

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        const string InvalidLoginMessage = "Invalid email/phone or password.";

        AuthCommandResult result = await _authCommands.LoginAsync(new LoginCommand
        {
            Login = request?.Login,
            Password = request?.Password
        }, cancellationToken);

        if (!result.Success || result.User == null || result.User.UserID == null || string.IsNullOrWhiteSpace(result.RoleName))
        {
            return result.FailureReason switch
            {
                AuthCommandFailureReason.InvalidRequest => Problem(statusCode: StatusCodes.Status400BadRequest, detail: result.Message),
                AuthCommandFailureReason.InvalidCredentials => Problem(statusCode: StatusCodes.Status401Unauthorized, detail: InvalidLoginMessage),
                AuthCommandFailureReason.UserDeleted => Problem(statusCode: StatusCodes.Status401Unauthorized, detail: InvalidLoginMessage),
                AuthCommandFailureReason.UserInactive => Problem(statusCode: StatusCodes.Status401Unauthorized, detail: result.Message),
                AuthCommandFailureReason.AccountLocked => Problem(statusCode: StatusCodes.Status429TooManyRequests, detail: result.Message),
                AuthCommandFailureReason.EmailNotVerified => StatusCode(StatusCodes.Status403Forbidden, new AuthResponse
                {
                    Success = false,
                    RequiresEmailVerification = true,
                    Message = result.Message
                }),
                AuthCommandFailureReason.RoleResolutionFailed => Problem(statusCode: StatusCodes.Status500InternalServerError, detail: result.Message),
                _ => Problem(statusCode: StatusCodes.Status500InternalServerError, detail: "Authentication failed.")
            };
        }

        if (result.User.TwoFactorEnabled)
        {
            string code = await _twoFactorService.GenerateAndStoreLoginCodeAsync(result.User.UserID.Value, cancellationToken);

            EmailTwoFactorSendResult sendResult = await _emailSender.SendTwoFactorCodeAsync(
                result.User.Email,
                result.User.FirstName,
                code,
                _twoFactorService.LoginChallengeLifetime,
                cancellationToken
            );

            if (!sendResult.Delivered)
            {
                _logger.LogWarning(
                    "Two-factor login code delivery failed for user {UserId}: {FailureMessage}",
                    result.User.UserID.Value,
                    sendResult.FailureMessage
                );

                return Problem(
                    statusCode: StatusCodes.Status503ServiceUnavailable,
                    detail: sendResult.FailureMessage ?? "Two-factor email could not be sent."
                );
            }

            if (sendResult.DebugCode is { Length: > 0 } && _logger.IsEnabled(LogLevel.Debug))
            {
                _logger.LogDebug(
                    "Two-factor login debug code issued for user {UserId}: {DebugCode}",
                    result.User.UserID.Value,
                    sendResult.DebugCode
                );
            }

            return Ok(AuthShared.BuildTwoFactorChallengeResponse(
                _twoFactorService,
                result.User.UserID.Value,
                "Two-factor verification is required."
            ));
        }

        UserPermissionSnapshot permissionSnapshot = await _userPermissionService.GetUserPermissionSnapshotAsync(
            result.User.UserID.Value,
            cancellationToken);

        return Ok(AuthShared.CreateAuthenticatedResponse(
            _tokenService,
            Response,
            result.User,
            result.RoleName,
            permissionSnapshot));
    }

    [HttpPost("signup")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AuthResponse>> Signup([FromBody] SignUpRequest request, CancellationToken cancellationToken)
    {
        AuthCommandResult result = await _authCommands.SignupAsync(new SignupCommand
        {
            Email = request?.Email,
            Password = request?.Password,
            FirstName = request?.FirstName,
            LastName = request?.LastName,
            Phone = request?.Phone,
            CityId = request?.CityId,
            AreaId = request?.AreaId,
            Bio = request?.Bio,
            Avatar = request?.Avatar
        }, cancellationToken);

        if (!result.Success || result.User == null || result.User.UserID == null || string.IsNullOrWhiteSpace(result.RoleName))
        {
            return result.FailureReason switch
            {
                AuthCommandFailureReason.RegistrationDisabled => Problem(statusCode: StatusCodes.Status403Forbidden, detail: result.Message),
                AuthCommandFailureReason.InvalidRequest => Problem(statusCode: StatusCodes.Status400BadRequest, detail: result.Message),
                AuthCommandFailureReason.DuplicateIdentity => Problem(statusCode: StatusCodes.Status400BadRequest, detail: result.Message),
                AuthCommandFailureReason.RoleResolutionFailed => Problem(statusCode: StatusCodes.Status500InternalServerError, detail: result.Message),
                AuthCommandFailureReason.PersistenceFailed => Problem(statusCode: StatusCodes.Status500InternalServerError, detail: result.Message),
                _ => Problem(statusCode: StatusCodes.Status500InternalServerError, detail: "An error occurred while creating your account. Please try again.")
            };
        }

        // Send verification email — don't issue JWT until verified
        EmailVerificationRequestResult verificationResult = await _emailVerificationService.SendVerificationAsync(
            result.User.UserID.Value,
            result.User.Email,
            result.User.FirstName,
            cancellationToken
        );

        if (!verificationResult.Success)
        {
            _logger.LogWarning(
                "Email verification send failed during signup for user {UserId}: {Reason}",
                result.User.UserID.Value,
                verificationResult.FailureReason
            );
        }

        return StatusCode(StatusCodes.Status201Created, new AuthResponse
        {
            Success = true,
            RequiresEmailVerification = true,
            Message = "Account created successfully. Please check your email to verify your account."
        });
    }

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UserResponseDTO>> GetCurrentUser(CancellationToken cancellationToken)
    {
        string? userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            return Problem(statusCode: StatusCodes.Status401Unauthorized, detail: "Invalid token. User ID not found.");
        }

        UserByIdQueryResult queryResult = await _userQueries.GetByIdAsync(new UserByIdQuery
        {
            TargetUserId = userId,
            RequesterUserId = userId,
            RequesterIsAdmin = false
        }, cancellationToken);

        if (!queryResult.Success || queryResult.User == null || queryResult.User.IsDeleted)
        {
            return Problem(statusCode: StatusCodes.Status401Unauthorized, detail: "User not found or deleted.");
        }

        UserModel user = queryResult.User;
        if (user.Status != UserStatusPolicy.Active)
        {
            return Problem(statusCode: StatusCodes.Status401Unauthorized, detail: "User account is banned or inactive.");
        }

        string roleName = await AuthShared.ResolveRoleNameForTokenAsync(_roles, user.RoleID, cancellationToken) ?? "User";
        UserPermissionSnapshot currentUserPermissions = await _userPermissionService.GetUserPermissionSnapshotAsync(
            userId,
            cancellationToken);
        return Ok(DTOMapper.ToUserResponseDTO(
            user,
            roleName,
            Request,
            currentUserPermissions.HasAdminAccess,
            currentUserPermissions.PermissionKeys));
    }

    [HttpPost("refresh")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponse>> RefreshToken(CancellationToken cancellationToken)
    {
        string? userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            return Problem(statusCode: StatusCodes.Status401Unauthorized, detail: "Invalid token.");
        }

        UserByIdQueryResult queryResult = await _userQueries.GetByIdAsync(new UserByIdQuery
        {
            TargetUserId = userId,
            RequesterUserId = userId,
            RequesterIsAdmin = false
        }, cancellationToken);

        if (!queryResult.Success || queryResult.User == null || queryResult.User.IsDeleted)
        {
            return Problem(statusCode: StatusCodes.Status401Unauthorized, detail: "User not found or deleted.");
        }

        UserModel user = queryResult.User;
        if (user.Status != UserStatusPolicy.Active)
        {
            return Problem(statusCode: StatusCodes.Status401Unauthorized, detail: "User account is banned or inactive.");
        }

        string? roleName = await AuthShared.ResolveRoleNameForTokenAsync(_roles, user.RoleID, cancellationToken);
        if (string.IsNullOrWhiteSpace(roleName))
        {
            return Problem(statusCode: StatusCodes.Status500InternalServerError, detail: "Unable to resolve user role.");
        }

        UserPermissionSnapshot refreshPermissions = await _userPermissionService.GetUserPermissionSnapshotAsync(
            user.UserID!.Value,
            cancellationToken);

        return Ok(AuthShared.CreateAuthenticatedResponse(
            _tokenService,
            Response,
            user,
            roleName,
            refreshPermissions));
    }

    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult> Logout(CancellationToken cancellationToken)
    {
        string? jti = User.FindFirstValue(JwtRegisteredClaimNames.Jti);
        string? expClaim = User.FindFirstValue(JwtRegisteredClaimNames.Exp);

        if (!string.IsNullOrWhiteSpace(jti) && long.TryParse(expClaim, out long expSeconds))
        {
            DateTimeOffset expiration = DateTimeOffset.FromUnixTimeSeconds(expSeconds);
            await _tokenBlacklistService.AddToBlacklistAsync(jti, expiration, cancellationToken);
        }

        bool isHttps = Request.IsHttps;
        var jwtDeleteOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = isHttps,
            SameSite = isHttps ? SameSiteMode.None : SameSiteMode.Lax,
            Path = "/"
        };
        Response.Cookies.Delete("jwt", jwtDeleteOptions);

        var csrfDeleteOptions = new CookieOptions
        {
            HttpOnly = false,
            Secure = isHttps,
            SameSite = isHttps ? SameSiteMode.None : SameSiteMode.Lax,
            Path = "/"
        };
        Response.Cookies.Delete("tj-csrf", csrfDeleteOptions);
        Response.Cookies.Delete("XSRF-TOKEN", csrfDeleteOptions);

        return Ok(new ApiMessageResponse { Message = "Logged out successfully" });
    }

    [HttpPost("verify-email")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AuthResponse>> VerifyEmail(
        [FromBody] VerifyEmailRequest request, CancellationToken cancellationToken)
    {
        EmailVerificationConfirmResult result = await _emailVerificationService.ConfirmVerificationAsync(
            request?.Token, cancellationToken);

        if (!result.Success)
        {
            int statusCode = result.FailureReason switch
            {
                EmailVerificationConfirmFailureReason.ExpiredToken => StatusCodes.Status400BadRequest,
                EmailVerificationConfirmFailureReason.InvalidToken => StatusCodes.Status400BadRequest,
                EmailVerificationConfirmFailureReason.UserNotFound => StatusCodes.Status404NotFound,
                EmailVerificationConfirmFailureReason.PersistenceFailed => StatusCodes.Status500InternalServerError,
                _ => StatusCodes.Status400BadRequest
            };

            return Problem(statusCode: statusCode, detail: result.Message);
        }

        // If we have the verified user, issue a JWT and log them in immediately.
        if (result.User?.UserID != null)
        {
            string? roleName = await AuthShared.ResolveRoleNameForTokenAsync(
                _roles, result.User.RoleID, cancellationToken);

            if (!string.IsNullOrWhiteSpace(roleName))
            {
                UserPermissionSnapshot permissionSnapshot = await _userPermissionService
                    .GetUserPermissionSnapshotAsync(result.User.UserID.Value, cancellationToken);

                return Ok(AuthShared.CreateAuthenticatedResponse(
                    _tokenService,
                    Response,
                    result.User,
                    roleName,
                    permissionSnapshot));
            }
        }

        // Fallback: verification succeeded but we couldn't resolve the role — tell the
        // frontend to redirect to /login (original behaviour preserved as a safety net).
        return Ok(new AuthResponse
        {
            Success = true,
            Message = result.Message ?? "Email verified successfully. Please sign in."
        });
    }


    [HttpPost("verify-email/resend")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiMessageResponse>> ResendVerificationEmail(
        [FromBody] ResendVerificationEmailRequest request, CancellationToken cancellationToken)
    {
        EmailVerificationRequestResult result = await _emailVerificationService.ResendVerificationAsync(
            request?.Email, cancellationToken);

        // Always return 200 to avoid leaking email existence
        return Ok(new ApiMessageResponse { Message = result.Message ?? "If an account exists with this email, a verification link has been sent." });
    }

}
