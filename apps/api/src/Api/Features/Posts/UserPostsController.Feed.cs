using Microsoft.AspNetCore.Mvc;
using TijarahJoDBAPI.Common.Services;

namespace TijarahJoDBAPI.Features.Posts
{
	public partial class UserPostsController
	{
		[HttpGet("feed", Name = "GetPostsFeed")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public ActionResult GetPostsFeed([FromQuery] PostsFeedRequest request)
		{
			var normalizedRequest = _postsFeedService.NormalizeRequest(
				request.Page,
				request.Limit,
				request.IncludeDeleted
			);

			try
			{
				FeedResponse response = _postsFeedService.FetchPostsFeed(normalizedRequest);
				return Ok(response);
			}
			catch (Exception ex)
			{
				_logger.LogError(
					ex,
					"Failed to fetch posts feed. page={Page}, limit={Limit}, includeDeleted={IncludeDeleted}",
					normalizedRequest.Page,
					normalizedRequest.Limit,
					normalizedRequest.IncludeDeleted
				);

				return StatusCode(StatusCodes.Status500InternalServerError, new
				{
					success = false,
					code = "POSTS_FEED_FAILED",
					message = "Failed to fetch posts feed.",
					traceId = HttpContext.TraceIdentifier
				});
			}
		}
	}
}
