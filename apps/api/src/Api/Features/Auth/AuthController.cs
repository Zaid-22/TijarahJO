using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using TijarahJo.Domain.Models;
using TijarahJoDB.Application.Abstractions.DataAccess;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.Application.Common;
using TijarahJoDB.BLL;
using TijarahJoDBAPI.Common.Services;
using TijarahJoDBAPI.Common.Utils;
using TijarahJoDBAPI.Contracts.Requests;
using TijarahJoDBAPI.Contracts.Responses;

namespace TijarahJoDBAPI.Features.Auth;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/auth")]
public class AuthController : ControllerBase
{
    private readonly ITokenService _tokenService;
    private readonly IAuthCommandService _authCommands;
    private readonly IUserQueryHandler _userQueries;
    private readonly IRoleService _roles;
    private readonly TwoFactorService _twoFactorService;
    private readonly ITokenBlacklistService _tokenBlacklistService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        ITokenService tokenService,
        IAuthCommandService authCommands,
        IUserQueryHandler userQueries,
        IRoleService roles,
        TwoFactorService twoFactorService,
        ITokenBlacklistService tokenBlacklistService,
        ILogger<AuthController> logger)
    {
        _tokenService = tokenService;
        _authCommands = authCommands;
        _userQueries = userQueries;
        _roles = roles;
        _twoFactorService = twoFactorService;
        _tokenBlacklistService = tokenBlacklistService;
        _logger = logger;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
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
                AuthCommandFailureReason.InvalidCredentials => Problem(statusCode: StatusCodes.Status401Unauthorized, detail: result.Message),
                AuthCommandFailureReason.UserDeleted => Problem(statusCode: StatusCodes.Status401Unauthorized, detail: result.Message),
                AuthCommandFailureReason.UserInactive => Problem(statusCode: StatusCodes.Status401Unauthorized, detail: result.Message),
                AuthCommandFailureReason.RoleResolutionFailed => Problem(statusCode: StatusCodes.Status500InternalServerError, detail: result.Message),
                _ => Problem(statusCode: StatusCodes.Status500InternalServerError, detail: "Authentication failed.")
            };
        }

        if (result.User.TwoFactorEnabled)
        {
            if (string.IsNullOrWhiteSpace(result.User.TwoFactorSecret))
            {
                return Problem(
                    statusCode: StatusCodes.Status500InternalServerError,
                    detail: "Two-factor secret is unavailable. Please reset 2FA from settings."
                );
            }
            return Ok(AuthShared.BuildTwoFactorChallengeResponse(_twoFactorService, result.User.UserID.Value));
        }

        return Ok(AuthShared.CreateAuthenticatedResponse(_tokenService, Response, result.User, result.RoleName));
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
                AuthCommandFailureReason.InvalidRequest => Problem(statusCode: StatusCodes.Status400BadRequest, detail: result.Message),
                AuthCommandFailureReason.DuplicateIdentity => Problem(statusCode: StatusCodes.Status400BadRequest, detail: result.Message),
                AuthCommandFailureReason.RoleResolutionFailed => Problem(statusCode: StatusCodes.Status500InternalServerError, detail: result.Message),
                AuthCommandFailureReason.PersistenceFailed => Problem(statusCode: StatusCodes.Status500InternalServerError, detail: result.Message),
                _ => Problem(statusCode: StatusCodes.Status500InternalServerError, detail: "An error occurred while creating your account. Please try again.")
            };
        }

        string token = _tokenService.GenerateToken(result.User.UserID.Value, result.User.Email, result.RoleName);
        AuthShared.SetTokenCookie(Response, token);

        return StatusCode(StatusCodes.Status201Created, new AuthResponse
        {
            Success = true,
            Token = token,
            User = DTOMapper.ToUserResponseDTO(result.User)
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

        return Ok(DTOMapper.ToUserResponseDTO(user));
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

        return Ok(AuthShared.CreateAuthenticatedResponse(_tokenService, Response, user, roleName));
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

        Response.Cookies.Delete("jwt");
        Response.Cookies.Delete("tj-csrf");
        Response.Cookies.Delete("XSRF-TOKEN");
        return Ok(new ApiMessageResponse { Message = "Logged out successfully" });
    }
}
