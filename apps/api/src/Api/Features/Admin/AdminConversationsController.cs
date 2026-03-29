using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Api.Common.Authorization;

namespace TijarahJo.Api.Features.Admin;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/conversations")]
[Authorize(Policy = AuthorizationPolicies.ChatView)]
public class AdminConversationsController : ControllerBase
{
    private readonly IAdminQueryHandler _adminQueries;

    public AdminConversationsController(IAdminQueryHandler adminQueries)
    {
        _adminQueries = adminQueries;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> GetConversations(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var result = await _adminQueries.GetConversationsAsync(page, pageSize, HttpContext.RequestAborted);
        if (!result.Success || result.Result == null)
        {
            return Problem(statusCode: result.StatusCode, title: "CONVERSATIONS_FAILED", detail: result.Message);
        }
        return Ok(result.Result);
    }

    [HttpGet("{id}/messages")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> GetConversationMessages(int id)
    {
        var result = await _adminQueries.GetConversationMessagesAsync(id, HttpContext.RequestAborted);
        if (!result.Success || result.Result == null)
        {
            return Problem(statusCode: result.StatusCode, title: "CONVERSATION_MESSAGES_FAILED", detail: result.Message);
        }
        return Ok(result.Result);
    }
}
