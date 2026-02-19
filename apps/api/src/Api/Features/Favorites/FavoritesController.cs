using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDBAPI.Common.Utils;

namespace TijarahJoDBAPI.Features.Favorites
{
    [ApiController]
    [Route("api/favorites")]
    [Authorize]
    public class FavoritesController : ControllerBase
    {
        private readonly IFavoriteService _favorites;
        private readonly IPostService _posts;

        public FavoritesController(IFavoriteService favorites, IPostService posts)
        {
            _favorites = favorites;
            _posts = posts;
        }

        public class AddFavoriteRequest
        {
            public string? PostId { get; set; }
        }

        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public ActionResult GetFavorites()
        {
            if (!ApiControllerHelpers.TryGetCurrentUserId(User, out int currentUserId))
            {
                return Unauthorized(new { message = "Invalid authentication token." });
            }

            var favorites = _favorites.GetFavoritesByUserId(currentUserId);
            var favoritePostIds = favorites
                .Select(f => f.PostID.ToString())
                .ToList();

            return Ok(new
            {
                success = true,
                favorites = favoritePostIds
            });
        }

        [HttpPost]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult AddFavorite([FromBody] AddFavoriteRequest? request)
        {
            if (!ApiControllerHelpers.TryGetCurrentUserId(User, out int currentUserId))
            {
                return Unauthorized(new { message = "Invalid authentication token." });
            }

            if (request == null || string.IsNullOrWhiteSpace(request.PostId))
            {
                return BadRequest(new { message = "PostId is required." });
            }

            if (!ApiControllerHelpers.TryParsePositiveId(request.PostId, out int postId))
            {
                return BadRequest(new { message = $"Invalid post ID: {request.PostId}" });
            }

            if (!_posts.DoesPostExist(postId))
            {
                return NotFound(new { message = $"Post with ID {postId} not found." });
            }

            bool saved = _favorites.AddFavorite(currentUserId, postId);
            if (!saved)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "Failed to add favorite."
                });
            }

            return Ok(new
            {
                success = true
            });
        }

        [HttpDelete("{postId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult RemoveFavorite(string postId)
        {
            if (!ApiControllerHelpers.TryGetCurrentUserId(User, out int currentUserId))
            {
                return Unauthorized(new { message = "Invalid authentication token." });
            }

            if (!ApiControllerHelpers.TryParsePositiveId(postId, out int parsedPostId))
            {
                return BadRequest(new { message = $"Invalid post ID: {postId}" });
            }

            bool removed = _favorites.RemoveFavorite(currentUserId, parsedPostId);
            if (!removed)
            {
                return NotFound(new
                {
                    message = "Favorite was not found."
                });
            }

            return Ok(new
            {
                success = true
            });
        }
    }
}
