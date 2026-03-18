using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJo.Api.Common.Authorization;
using TijarahJo.Api.Common.Utils;
using TijarahJo.Api.Contracts.Requests;
using TijarahJo.Api.Contracts.Responses;

namespace TijarahJo.Api.Features.Users;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/users")]
public class UsersController : ControllerBase
{
    private readonly IUserQueryHandler _userQueries;
    private readonly IUserCommandService _userCommands;

    public UsersController(IUserQueryHandler userQueries, IUserCommandService userCommands)
    {
        _userQueries = userQueries;
        _userCommands = userCommands;
    }

    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    [HttpGet("")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<UserResponseDTO>>> GetAllUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        UserListQueryResult result = await _userQueries.GetAllAsync(page, pageSize, HttpContext.RequestAborted);
        if (!result.Success)
        {
            return this.ToUserListQueryProblem(result, "Failed to fetch users.");
        }

        if (result.Users.Count == 0)
        {
            return Ok(new List<UserResponseDTO>());
        }

        List<UserResponseDTO> dtoList = result.Users
            .Select(u => DTOMapper.ToUserResponseDTO(u))
            .ToList();
        return Ok(dtoList);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserResponseDTO>> GetUserById(int id)
    {
        bool hasCurrentUserId = ApiControllerHelpers.TryGetCurrentUserId(User, out int currentUserId);
        UserByIdQueryResult result = await _userQueries.GetByIdAsync(new UserByIdQuery
        {
            TargetUserId = id,
            RequesterUserId = hasCurrentUserId ? currentUserId : null,
            RequesterIsAdmin = ApiControllerHelpers.IsAdminUser(User)
        }, HttpContext.RequestAborted);
        if (!result.Success || result.User == null)
        {
            return this.ToUserByIdQueryProblem(result, "Failed to fetch user.");
        }

        return Ok(DTOMapper.ToUserResponseDTO(result.User));
    }

    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<UserResponseDTO>> Register([FromBody] CreateUserRequest request, CancellationToken cancellationToken)
    {
        UserCommandResult result = await _userCommands.RegisterAsync(new RegisterUserCommand
        {
            Password = request.Password,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Phone = request.Phone,
            CityId = request.CityId,
            AreaId = request.AreaId,
            Bio = request.Bio,
            Avatar = request.Avatar,
            JoinDate = request.JoinDate,
            Status = request.Status,
            RoleId = request.RoleID,
            IsDeleted = request.IsDeleted
        }, cancellationToken);
        if (!result.Success || result.User == null)
        {
            return this.ToUserCommandProblem(result, "Failed to register user.");
        }

        return CreatedAtAction(
            nameof(GetUserById),
            new { id = result.User.UserID },
            DTOMapper.ToUserResponseDTO(result.User)
        );
    }

    [Authorize]
    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<UserResponseDTO>> UpdateUser(int id, [FromBody] UpdateUserRequest updatedUser, CancellationToken cancellationToken)
    {
        if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int currentUserId, out ActionResult? failureResult))
        {
            return failureResult!;
        }

        UserCommandResult result = await _userCommands.UpdateAsync(new UpdateUserCommand
        {
            ActorUserId = currentUserId,
            ActorIsAdmin = ApiControllerHelpers.IsAdminUser(User),
            TargetUserId = id,
            Password = updatedUser.Password,
            Email = updatedUser.Email,
            FirstName = updatedUser.FirstName,
            LastName = updatedUser.LastName,
            Phone = updatedUser.Phone,
            CityId = updatedUser.CityId,
            AreaId = updatedUser.AreaId,
            Bio = updatedUser.Bio,
            Avatar = updatedUser.Avatar,
            Status = updatedUser.Status,
            RoleId = updatedUser.RoleID,
            IsDeleted = updatedUser.IsDeleted
        }, cancellationToken);
        if (!result.Success || result.User == null)
        {
            return this.ToUserCommandProblem(result, "Error updating user.");
        }

        return Ok(DTOMapper.ToUserResponseDTO(result.User));
    }

    [Authorize]
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> DeleteUser(int id, CancellationToken cancellationToken)
    {
        if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int currentUserId, out ActionResult? failureResult))
        {
            return failureResult!;
        }

        UserCommandResult result = await _userCommands.DeleteAsync(new DeleteUserCommand
        {
            ActorUserId = currentUserId,
            ActorIsAdmin = ApiControllerHelpers.IsAdminUser(User),
            TargetUserId = id
        }, cancellationToken);
        if (!result.Success)
        {
            return this.ToUserCommandProblem(result, "Error deleting user.");
        }

        return NoContent();
    }

    [Authorize]
    [HttpGet("Exists/{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<bool>> DoesUserExist(int id)
    {
        UserExistsQueryResult result = await _userQueries.ExistsAsync(id, HttpContext.RequestAborted);
        if (!result.Success)
        {
            return this.ToUserExistsQueryProblem(result, "Failed to check user existence.");
        }

        return Ok(result.Exists);
    }

}
