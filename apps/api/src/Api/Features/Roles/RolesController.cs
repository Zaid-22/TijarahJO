using Microsoft.AspNetCore.Mvc;
using Models;
using System.Collections.Generic;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.BLL;
using Microsoft.AspNetCore.Authorization;

namespace TijarahJoDBAPI.Features.Roles
{
	[ApiController]
	[Route("api/roles")]
	public class RolesController : ControllerBase
	{
		private readonly IRoleService _roles;
		private static readonly DateTime SqlDateTimeMinUtc = new DateTime(1753, 1, 1, 0, 0, 0, DateTimeKind.Utc);

		public RolesController(IRoleService roles)
		{
			_roles = roles;
		}

		private static DateTime NormalizeSqlDateTime(DateTime value, DateTime? fallback = null)
		{
			if (value == default || value < SqlDateTimeMinUtc)
			{
				return fallback ?? DateTime.UtcNow;
			}

			return value.Kind switch
			{
				DateTimeKind.Utc => value,
				DateTimeKind.Local => value.ToUniversalTime(),
				_ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
			};
		}

		[HttpGet("")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public ActionResult<IEnumerable<RoleModel>> GetAllRoles()
		{
			var roles = _roles.GetAllRoles();

			if (roles == null || roles.Count == 0)
			{
				return Ok(new List<RoleModel>());
			}

			var dtoList = new List<RoleModel>();

			foreach (var roleModel in roles)
			{
				if (roleModel.IsDeleted)
				{
					continue;
				}

				dtoList.Add(roleModel);
			}

			return Ok(dtoList);
		}

		[HttpGet("{id:int}")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public ActionResult<RoleModel> GetRoleById(int id)
		{
			if (id < 1)
			{
				return BadRequest($"Not accepted ID {id}");
			}

			Role? role = _roles.Find(id);

			if (role == null)
			{
				return NotFound($"Role with ID {id} not found.");
			}

			RoleModel dto = role.RoleModel;

			return Ok(dto);
		}

		[Authorize(Roles = "1")]
		[HttpPost]
		[ProducesResponseType(StatusCodes.Status201Created)]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		public ActionResult<RoleModel> AddRole(RoleModel newRoleModel)
		{
			if (newRoleModel == null || string.IsNullOrWhiteSpace(newRoleModel.RoleName))
			{
				return BadRequest("Invalid Role data.");
			}

			newRoleModel.RoleName = newRoleModel.RoleName.Trim();
			newRoleModel.CreatedAt = NormalizeSqlDateTime(newRoleModel.CreatedAt);
			newRoleModel.IsDeleted = false;

			Role role = _roles.Create(new RoleModel
			(
					newRoleModel.RoleID,
					newRoleModel.RoleName,
					newRoleModel.CreatedAt,
					newRoleModel.IsDeleted
			));

			if (!_roles.Save(role))
			{
				return StatusCode(StatusCodes.Status500InternalServerError, "Error adding Role");
			}

			newRoleModel.RoleID = role.RoleID;

			return CreatedAtAction(nameof(GetRoleById), new { id = newRoleModel.RoleID }, newRoleModel);
		}

		[Authorize(Roles = "1")]
		[HttpPut("{id:int}")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public ActionResult<RoleModel> UpdateRole(int id, RoleModel updatedRole)
		{
			if (id < 1 || updatedRole == null || string.IsNullOrWhiteSpace(updatedRole.RoleName))
			{
				return BadRequest("Invalid Role data.");
			}

			Role? role = _roles.Find(id);

			if (role == null)
			{
				return NotFound($"Role with ID {id} not found.");
			}

			role.RoleName = updatedRole.RoleName.Trim();
			role.CreatedAt = NormalizeSqlDateTime(role.CreatedAt, DateTime.UtcNow);

			if (!_roles.Save(role))
			{
				return StatusCode(StatusCodes.Status500InternalServerError, "Error updating Role");
			}

			return Ok(role.RoleModel);
		}

		[Authorize(Roles = "1")]
		[HttpDelete("{id:int}")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public ActionResult DeleteRole(int id)
		{
			if (id < 1)
			{
				return BadRequest($"Not accepted ID {id}");
			}

			if (_roles.DeleteRole(id))
			{
				return Ok($"Role with ID {id} has been deleted.");
			}
			else
			{
				return NotFound($"Role with ID {id} not found. No rows deleted!");
				}
		}

		[HttpGet("Exists/{id:int}")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		public ActionResult<bool> DoesRoleExist(int id)
		{
			if (id < 1)
			{
				return BadRequest($"Not accepted ID {id}");
			}

			bool exists = _roles.DoesRoleExist(id);

			return Ok(exists);
		}
	}
}
