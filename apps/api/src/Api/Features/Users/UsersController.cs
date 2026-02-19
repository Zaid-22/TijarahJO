using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using TijarahJoDB.BLL;
using Models;
using Microsoft.AspNetCore.Authorization;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDBAPI.Contracts.Responses;
using TijarahJoDBAPI.Contracts.Requests;
using TijarahJoDBAPI.Common.Utils;

namespace TijarahJoDBAPI.Features.Users
{
	[ApiController]
	[Route("api/users")] // Primary route for frontend compatibility
	public class UsersController : ControllerBase
	{
		private readonly ILogger<UsersController> _logger;
		private readonly IUserService _users;

			public UsersController(ILogger<UsersController> logger, IUserService users)
			{
				_logger = logger;
				_users = users;
			}

		[Authorize(Roles = "1")]
		[HttpGet("", Name = "GetAllUsers")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public ActionResult<IEnumerable<UserResponseDTO>> GetAllUsers()
		{
			var users = _users.GetAllUsers();

			if (users == null || users.Count == 0)
			{
				return Ok(new List<UserResponseDTO>()); // Return empty list instead of 404
			}

			var dtoList = new List<UserResponseDTO>();

			foreach (var userModel in users)
			{
				dtoList.Add(DTOMapper.ToUserResponseDTO(userModel));
			}

			return Ok(dtoList);
		}

		[HttpGet("{id:int}", Name = "GetUserById")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public ActionResult<UserResponseDTO> GetUserById(int id)
		{
			if (id < 1)
			{
				return BadRequest(new { message = $"Invalid user ID: {id}" });
			}

			UserAccount? user = _users.Find(id);

				if (user == null)
				{
					return NotFound(new { message = $"User with ID {id} not found." });
				}

				var responseDto = DTOMapper.ToUserResponseDTO(user.UserModel);
				bool hasCurrentUserId = ApiControllerHelpers.TryGetCurrentUserId(User, out int currentUserId);
				bool isSelfRequest = hasCurrentUserId && currentUserId == id;
				bool isAdmin = ApiControllerHelpers.IsAdminUser(User);

				// Keep this endpoint usable for public seller pages, but avoid leaking private fields.
				if (!isSelfRequest && !isAdmin)
				{
					responseDto.Email = string.Empty;
					responseDto.Status = 0;
					responseDto.RoleID = 0;
					responseDto.IsDeleted = false;
				}

				return Ok(responseDto);
	        }



		[Authorize(Roles = "1")]
		[HttpPost(Name = "RegisterUser")]
		[ProducesResponseType(StatusCodes.Status201Created)]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status401Unauthorized)]
		[ProducesResponseType(StatusCodes.Status403Forbidden)]
		public ActionResult<UserResponseDTO> Register([FromBody] CreateUserRequest? request)
		{
			if (request == null || string.IsNullOrWhiteSpace(request.Password) || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.FirstName))
			{
				return BadRequest("Invalid user data.");
			}

			int status = request.Status.HasValue && request.Status.Value > 0 ? request.Status.Value : 1;
			int roleId = request.RoleID.HasValue && request.RoleID.Value > 0 ? request.RoleID.Value : 2;
			DateTime joinDate = request.JoinDate.HasValue && request.JoinDate.Value != default ? request.JoinDate.Value : DateTime.UtcNow;
			string hashedPassword = PasswordHelper.HashPassword(request.Password.Trim());

			UserAccount user = _users.Create(new UserModel
			(
					null,
					hashedPassword,
					request.Email.Trim().ToLowerInvariant(),
					request.FirstName.Trim(),
					request.LastName?.Trim() ?? string.Empty,
					string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
					string.IsNullOrWhiteSpace(request.City) ? null : request.City.Trim(),
					string.IsNullOrWhiteSpace(request.Area) ? null : request.Area.Trim(),
					string.IsNullOrWhiteSpace(request.Bio) ? null : request.Bio.Trim(),
					string.IsNullOrWhiteSpace(request.Avatar) ? null : request.Avatar.Trim(),
					joinDate,
					status,
					roleId,
					request.IsDeleted ?? false
			));

			if (!_users.Save(user))
			{
				return StatusCode(StatusCodes.Status500InternalServerError, "Error adding UserAccount");
			}

			var responseDto = DTOMapper.ToUserResponseDTO(user.UserModel);
            return CreatedAtAction(nameof(GetUserById), new { id = user.UserID }, responseDto);
		}


		[Authorize]
		[HttpPut("{id}", Name = "UpdateUser")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status403Forbidden)]
			public ActionResult<UserResponseDTO> UpdateUser(int id, UpdateUserRequest? updatedUser)
			{
				if (!ApiControllerHelpers.TryGetCurrentUserId(User, out int currentUserId))
				{
					return Unauthorized("Invalid authentication token.");
				}

			if (id < 1 || updatedUser == null)
			{
				return BadRequest(new { message = "Invalid user data." });
			}

				bool isAdmin = ApiControllerHelpers.IsAdminUser(User);

			// Security: Users can only update their own profile (unless admin)
			if (id != currentUserId && !isAdmin)
			{
				_logger.LogWarning(
					"User {CurrentUserId} attempted to update UserID {TargetUserId} without permission.",
					currentUserId,
					id
				);
				return StatusCode(StatusCodes.Status403Forbidden, "You can only update your own profile.");
			}

			UserAccount? user = _users.Find(id);

			if (user == null)
			{
				return NotFound(new { message = $"User with ID {id} not found." });
			}

			// The API contract accepts a plaintext Password, and the server is responsible for hashing.
			if (!string.IsNullOrWhiteSpace(updatedUser.Password))
			{
				user.HashedPassword = PasswordHelper.HashPassword(updatedUser.Password.Trim());
			}

			// Update other fields
			if (!string.IsNullOrWhiteSpace(updatedUser.Email))
			{
				user.Email = updatedUser.Email.Trim().ToLowerInvariant();
			}

			if (!string.IsNullOrWhiteSpace(updatedUser.FirstName))
			{
				user.FirstName = updatedUser.FirstName.Trim();
			}

			if (updatedUser.LastName != null)
			{
				user.LastName = string.IsNullOrWhiteSpace(updatedUser.LastName)
					? string.Empty
					: updatedUser.LastName.Trim();
			}

			if (updatedUser.Phone != null)
			{
				user.Phone = string.IsNullOrWhiteSpace(updatedUser.Phone)
					? null
					: updatedUser.Phone.Trim();
			}

			if (updatedUser.City != null)
			{
				user.City = string.IsNullOrWhiteSpace(updatedUser.City)
					? null
					: updatedUser.City.Trim();
			}

			if (updatedUser.Area != null)
			{
				user.Area = string.IsNullOrWhiteSpace(updatedUser.Area)
					? null
					: updatedUser.Area.Trim();
			}

			if (updatedUser.Bio != null)
			{
				user.Bio = string.IsNullOrWhiteSpace(updatedUser.Bio)
					? null
					: updatedUser.Bio.Trim();
			}

			if (updatedUser.Avatar != null)
			{
				user.Avatar = string.IsNullOrWhiteSpace(updatedUser.Avatar)
					? null
					: updatedUser.Avatar.Trim();
			}
			
			// Preserve JoinDate - don't allow it to be changed
			// user.JoinDate = updatedUser.JoinDate;

			// Prevent non-admin users from modifying account control fields.
			if (isAdmin)
			{
				if (updatedUser.Status.HasValue && updatedUser.Status.Value > 0)
				{
					user.Status = updatedUser.Status.Value;
				}

				if (updatedUser.RoleID.HasValue && updatedUser.RoleID.Value > 0)
				{
					user.RoleID = updatedUser.RoleID.Value;
				}

				if (updatedUser.IsDeleted.HasValue)
				{
					user.IsDeleted = updatedUser.IsDeleted.Value;
					}
				}

			try
			{
				if (!_users.Save(user))
				{
					_logger.LogWarning("User save returned false for UserID {UserId}.", id);
					return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Failed to update user. No changes were made. Please verify the user exists and try again." });
				}
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Unhandled exception while updating UserID {UserId}.", id);
				return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Error updating user." });
			}

			return Ok(DTOMapper.ToUserResponseDTO(user.UserModel));
		}







		[Authorize]
		[HttpDelete("{id}", Name = "DeleteUser")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status401Unauthorized)]
		[ProducesResponseType(StatusCodes.Status403Forbidden)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
			public ActionResult DeleteUser(int id)
			{
				try
				{
					if (!ApiControllerHelpers.TryGetCurrentUserId(User, out int currentUserId))
					{
						return Unauthorized(new { message = "Invalid authentication token." });
					}

				if (id < 1)
				{
					return BadRequest(new { message = $"Invalid user ID: {id}" });
				}

				// Security: Users can only delete their own account (unless admin)
					if (id != currentUserId && !ApiControllerHelpers.IsAdminUser(User))
					{
					_logger.LogWarning(
						"User {CurrentUserId} attempted to delete UserID {TargetUserId} without permission.",
						currentUserId,
						id
					);
					return StatusCode(StatusCodes.Status403Forbidden, new { message = "You can only delete your own account." });
				}

				// Verify user exists before attempting deletion
				UserAccount? user = _users.Find(id);
				if (user == null)
				{
					return NotFound(new { message = $"User with ID {id} not found." });
				}

				// Attempt deletion
				if (_users.DeleteUser(id))
				{
					return Ok(new { message = $"User with ID {id} has been deleted." });
				}
				else
				{
					_logger.LogWarning("UserAccount.DeleteUser returned false for UserID {UserId}.", id);
					return StatusCode(StatusCodes.Status500InternalServerError, new { message = $"Failed to delete user. The user may have related data (posts, images, etc.) that prevents deletion." });
				}
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Unhandled exception while deleting UserID {UserId}.", id);
				return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Error deleting user." });
			}
		}

		[HttpGet("Exists/{id}", Name = "DoesUserExist")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[Authorize]
		public ActionResult<bool> DoesUserExist(int id)
		{
			if (id < 1)
			{
				return BadRequest($"Not accepted ID {id}");
			}

			bool exists = _users.DoesUserExist(id);

			return Ok(exists);
		}
	}
}
