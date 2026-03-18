using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJo.Api.Common.Utils;
using TijarahJo.Api.Contracts.Requests;
using TijarahJo.Api.Contracts.Responses;

namespace TijarahJo.Api.Features.Favorites;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/favorites")]
[Authorize]
public class FavoritesController : ControllerBase
{
    private readonly IFavoriteQueryHandler _favoriteQueries;

    public FavoritesController(IFavoriteQueryHandler favoriteQueries)
    {
        _favoriteQueries = favoriteQueries;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<FavoritesResponse>> GetFavorites()
    {
        if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int currentUserId, out ActionResult? failureResult))
        {
            return failureResult!;
        }

        FavoriteListQueryResult result = await _favoriteQueries.GetFavoritesAsync(currentUserId, HttpContext.RequestAborted);
        if (!result.Success)
        {
            return this.ToFavoriteListQueryProblem(result, "Failed to fetch favorites.");
        }

        return Ok(new FavoritesResponse
        {
            Success = true,
            Favorites = result.FavoritePostIds.ToList()
        });
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OperationSuccessResponse>> AddFavorite([FromBody] AddFavoriteRequest request)
    {
        if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int currentUserId, out ActionResult? failureResult))
        {
            return failureResult!;
        }

        FavoriteOperationQueryResult result = await _favoriteQueries.AddAsync(
            currentUserId,
            request.PostId,
            HttpContext.RequestAborted
        );
        if (!result.Success)
        {
            return this.ToFavoriteOperationQueryProblem(result, "Favorite operation failed.");
        }

        return Ok(new OperationSuccessResponse
        {
            Success = true
        });
    }

    [HttpDelete("{postId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OperationSuccessResponse>> RemoveFavorite(string postId)
    {
        if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int currentUserId, out ActionResult? failureResult))
        {
            return failureResult!;
        }

        FavoriteOperationQueryResult result = await _favoriteQueries.RemoveAsync(
            currentUserId,
            postId,
            HttpContext.RequestAborted
        );
        if (!result.Success)
        {
            return this.ToFavoriteOperationQueryProblem(result, "Favorite operation failed.");
        }

        return Ok(new OperationSuccessResponse
        {
            Success = true
        });
    }
}
