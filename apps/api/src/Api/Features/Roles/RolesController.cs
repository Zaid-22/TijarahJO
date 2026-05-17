using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Api.Common.Authorization;
using TijarahJo.Api.Common.Utils;
using TijarahJo.Api.Contracts.Requests;
using TijarahJo.Api.Contracts.Responses;

namespace TijarahJo.Api.Features.Roles;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/roles")]
public class RolesController(IRoleQueryHandler roleQueries, IRoleCommandService roleCommands) : ControllerBase
{
    [HttpGet("")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<RoleResponseDTO>>> GetAllRoles()
    {
        RoleListQueryResult result = await roleQueries.GetAllAsync(HttpContext.RequestAborted);
        if (!result.Success)
        {
            return this.ToRoleListQueryProblem(result, "Failed to fetch roles.");
        }

        if (result.Roles.Count == 0)
        {
            return Ok(Array.Empty<RoleResponseDTO>());
        }

        List<RoleResponseDTO> dtoList = [.. result.Roles
            .Select(DTOMapper.ToRoleResponseDTO)];

        return Ok(dtoList);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RoleResponseDTO>> GetRoleById(int id)
    {
        RoleByIdQueryResult result = await roleQueries.GetByIdAsync(id, HttpContext.RequestAborted);
        if (!result.Success || result.Role == null)
        {
            return this.ToRoleByIdQueryProblem(result, "Failed to fetch role.");
        }

        return Ok(DTOMapper.ToRoleResponseDTO(result.Role));
    }

    [Authorize(Policy = AuthorizationPolicies.RolesManage)]
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RoleResponseDTO>> AddRole([FromBody] CreateRoleRequest request)
    {
        RoleCommandResult result = await roleCommands.CreateAsync(
            new CreateRoleCommand
            {
                RoleName = request.RoleName
            },
            HttpContext.RequestAborted
        );
        if (!result.Success || result.Role == null)
        {
            return this.ToRoleCommandProblem(result, "Role operation failed.");
        }

        return CreatedAtAction(
            nameof(GetRoleById),
            new { id = result.Role.RoleID },
            DTOMapper.ToRoleResponseDTO(result.Role.RoleModel)
        );
    }

    [Authorize(Policy = AuthorizationPolicies.RolesManage)]
    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RoleResponseDTO>> UpdateRole(int id, [FromBody] UpdateRoleRequest request)
    {
        RoleCommandResult result = await roleCommands.UpdateAsync(
            new UpdateRoleCommand
            {
                RoleId = id,
                RoleName = request.RoleName
            },
            HttpContext.RequestAborted
        );
        if (!result.Success || result.Role == null)
        {
            return this.ToRoleCommandProblem(result, "Role operation failed.");
        }

        return Ok(DTOMapper.ToRoleResponseDTO(result.Role.RoleModel));
    }

    [Authorize(Policy = AuthorizationPolicies.RolesManage)]
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteRole(int id)
    {
        RoleCommandResult result = await roleCommands.DeleteAsync(id, HttpContext.RequestAborted);
        if (!result.Success)
        {
            return this.ToRoleCommandProblem(result, "Role operation failed.");
        }

        return Ok(new ApiMessageResponse { Message = $"Role with ID {id} has been deleted." });
    }

    [HttpGet("Exists/{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<bool>> DoesRoleExist(int id)
    {
        RoleExistsQueryResult result = await roleQueries.ExistsAsync(id, HttpContext.RequestAborted);
        if (!result.Success)
        {
            return this.ToRoleExistsQueryProblem(result, "Failed to check role existence.");
        }

        return Ok(result.Exists);
    }
}
