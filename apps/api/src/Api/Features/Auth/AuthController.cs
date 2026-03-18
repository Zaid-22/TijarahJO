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
    TwoFactorService twoFactorService,
    ITokenBlacklistService tokenBlacklistService,
    IBackgroundJobService backgroundJobService,
    ILogger<AuthController> logger) : ControllerBase
{
    private readonly ITokenService _tokenService = tokenService;
    private readonly IAuthCommandService _authCommands = authCommands;
    private readonly IUserQueryHandler _userQueries = userQueries;
    private readonly IRoleService _roles = roles;
    private readonly TwoFactorService _twoFactorService = twoFactorService;
    private readonly ITokenBlacklistService _tokenBlacklistService = tokenBlacklistService;
    private readonly IBackgroundJobService _backgroundJobService = backgroundJobService;
    private readonly ILogger<AuthController> _logger = logger;

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
            string code = _twoFactorService.GenerateAndStoreLoginCode(result.User.UserID.Value);
            
            await _backgroundJobService.EnqueueAsync(async (sp, ct) =>
            {
                var sender = sp.GetRequiredService<IEmailTwoFactorSender>();
                await sender.SendTwoFactorCodeAsync(
                    result.User.Email,
                    result.User.FirstName,
                    code,
                    TimeSpan.FromSeconds(900),
                    ct);
            }, cancellationToken);

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
