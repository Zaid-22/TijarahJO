using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Api.Common.Authorization;
using TijarahJo.Api.Common.Utils;
using TijarahJo.Api.Contracts.Requests;
using TijarahJo.Api.Contracts.Responses;
using TijarahJo.Api.Common.Services;
using Microsoft.Extensions.Logging;
namespace TijarahJo.Api.Features.Users;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/users")]
public class UsersController(
    IUserQueryHandler userQueries,
    IUserCommandService userCommands,
    IAuthorizationService authorizationService) : ControllerBase
{
    private readonly IUserQueryHandler _userQueries = userQueries;
    private readonly IUserCommandService _userCommands = userCommands;
    private readonly IAuthorizationService _authorizationService = authorizationService;

    [Authorize(Policy = AuthorizationPolicies.UsersView)]
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
            return Ok(Array.Empty<UserResponseDTO>());
        }

        List<UserResponseDTO> dtoList = [.. result.Users
            .Select(u => DTOMapper.ToUserResponseDTO(u, request: Request))];
        return Ok(dtoList);
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserResponseDTO>> GetUserById(int id)
    {
        bool hasCurrentUserId = ApiControllerHelpers.TryGetCurrentUserId(User, out int currentUserId);
        bool requesterHasUsersViewAccess = hasCurrentUserId
            && (await _authorizationService.AuthorizeAsync(
                User,
                resource: null,
                AuthorizationPolicies.UsersView)).Succeeded;
        UserByIdQueryResult result = await _userQueries.GetByIdAsync(new UserByIdQuery
        {
            TargetUserId = id,
            RequesterUserId = hasCurrentUserId ? currentUserId : null,
            RequesterIsAdmin = requesterHasUsersViewAccess
        }, HttpContext.RequestAborted);
        if (!result.Success || result.User == null)
        {
            return this.ToUserByIdQueryProblem(result, "Failed to fetch user.");
        }

        return Ok(DTOMapper.ToUserResponseDTO(result.User, request: Request));
    }

    [Authorize(Policy = AuthorizationPolicies.UsersManage)]
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
            DTOMapper.ToUserResponseDTO(result.User, request: Request)
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

        bool hasUsersManageAccess = (await _authorizationService.AuthorizeAsync(
            User,
            resource: null,
            AuthorizationPolicies.UsersManage)).Succeeded;

        UserCommandResult result = await _userCommands.UpdateAsync(new UpdateUserCommand
        {
            ActorUserId = currentUserId,
            ActorIsAdmin = hasUsersManageAccess,
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
            IsDeleted = updatedUser.IsDeleted,
            ClearSuspension = updatedUser.ClearSuspension
        }, cancellationToken);
        if (!result.Success || result.User == null)
        {
            return this.ToUserCommandProblem(result, "Error updating user.");
        }

        return Ok(DTOMapper.ToUserResponseDTO(result.User, request: Request));
    }

    [Authorize]
    [HttpPost("{id:int}/avatar")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserAvatarUploadResponseDTO>> UploadAvatar(
        int id, 
        [FromForm] UploadUserAvatarRequest request,
        [FromServices] IPostImageFileStorageService fileStorage,
        [FromServices] IImageModerationService imageModeration,
        [FromServices] ILogger<UsersController> logger,
        CancellationToken cancellationToken)
    {
        if (id < 1)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Invalid user ID.");
        }

        if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int currentUserId, out ActionResult? failureResult))
        {
            return failureResult!;
        }

        bool hasUsersManageAccess = (await _authorizationService.AuthorizeAsync(
            User,
            resource: null,
            AuthorizationPolicies.UsersManage)).Succeeded;

        if (currentUserId != id && !hasUsersManageAccess)
        {
            logger.LogWarning("User {UserId} attempted to upload avatar for UserID {TargetId}.", currentUserId, id);
            return Forbid();
        }

        if (request.File == null)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Image file is required.");
        }

        try
        {
            fileStorage.ValidateFileOrThrow(request.File);
        }
        catch (ArgumentException ex)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: ex.Message);
        }

        ModerationResult moderationResult = await imageModeration.CheckImageAsync(request.File);
        if (moderationResult.IsUnavailable)
        {
            return Problem(
                statusCode: StatusCodes.Status503ServiceUnavailable, 
                detail: moderationResult.FailureReason ?? "Image moderation service is unavailable."
            );
        }

        if (moderationResult.IsFlagged)
        {
            logger.LogWarning("User {UserId} attempted to upload a flagged avatar.", currentUserId);
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Image rejected by moderation filters (inappropriate content detected).");
        }

        StoredPostImageFile storedFile;
        try
        {
            storedFile = await fileStorage.SaveUserAvatarAsync(request.File, cancellationToken);
        }
        catch (ArgumentException ex)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: ex.Message);
        }

        UserCommandResult result = await _userCommands.UpdateAsync(new UpdateUserCommand
        {
            ActorUserId = currentUserId,
            ActorIsAdmin = hasUsersManageAccess,
            TargetUserId = id,
            Avatar = storedFile.PublicUrl
        }, cancellationToken);

        if (!result.Success || result.User == null)
        {
            await fileStorage.DeleteByPublicUrlAsync(storedFile.PublicUrl, cancellationToken);
            return this.ToUserCommandProblem(result, "Avatar upload failed to save.");
        }

        UserResponseDTO userDto = DTOMapper.ToUserResponseDTO(result.User, request: Request);
        return Ok(new UserAvatarUploadResponseDTO
        {
            AvatarUrl = userDto.Avatar ?? string.Empty,
            User = userDto
        });
    }

    [Authorize]
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
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

        bool hasUsersManageAccess = (await _authorizationService.AuthorizeAsync(
            User,
            resource: null,
            AuthorizationPolicies.UsersManage)).Succeeded;

        UserCommandResult result = await _userCommands.DeleteAsync(new DeleteUserCommand
        {
            ActorUserId = currentUserId,
            ActorIsAdmin = hasUsersManageAccess,
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
