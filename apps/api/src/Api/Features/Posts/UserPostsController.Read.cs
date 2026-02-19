using Microsoft.AspNetCore.Mvc;
using Models;
using TijarahJoDB.BLL;

namespace TijarahJoDBAPI.Features.Posts
{
	public partial class UserPostsController
	{
		[HttpGet("All", Name = "GetAllPostsLegacyGone")]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public ActionResult GetAllPostsLegacyGone()
		{
			return NotFound(new
			{
				code = "POSTS_LEGACY_ENDPOINT_REMOVED",
				message = "The legacy /api/posts/All endpoint was removed. Use /api/posts/feed."
			});
		}

		[HttpGet("pagination", Name = "GetPostsPaginationLegacyGone")]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public ActionResult GetPostsPaginationLegacyGone()
		{
			return NotFound(new
			{
				code = "POSTS_LEGACY_ENDPOINT_REMOVED",
				message = "The legacy /api/posts/pagination endpoint was removed. Use /api/posts/feed."
			});
		}

		[HttpGet("{id:int}", Name = "GetPostById")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public ActionResult<PostModel> GetPostById(int id)
		{
			if (id < 1)
			{
				return BadRequest($"Not accepted ID {id}");
			}

			Post? post = _posts.Find(id);
			if (post == null || post.IsDeleted)
			{
				return NotFound($"Post with ID {id} not found.");
			}

			PostModel dto = post.PostModel;

			return Ok(dto);
		}

			[HttpGet("Exists/{id:int}", Name = "DoesPostExist")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		public ActionResult<bool> DoesPostExist(int id)
		{
			if (id < 1)
			{
				return BadRequest($"Not accepted ID {id}");
			}

			bool exists = _posts.DoesPostExist(id);

			return Ok(exists);
		}

			[HttpPost("{id:int}/views", Name = "IncrementPostViews")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public ActionResult IncrementPostViews(int id)
		{
			if (id < 1)
			{
				return BadRequest($"Invalid post ID: {id}");
			}

			Post? post = _posts.Find(id);
			if (post == null)
			{
				return NotFound($"Post with ID {id} not found.");
			}

			if (_posts.IncrementViews(id))
			{
				return Ok(new { message = "View count incremented", postId = id });
			}

			return StatusCode(StatusCodes.Status500InternalServerError, "Error incrementing view count");
		}

		[HttpGet("user/{userId}", Name = "GetUserPosts")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public ActionResult<IEnumerable<PostModel>> GetUserPosts(int userId)
		{
			if (userId < 1)
			{
				return BadRequest($"Invalid user ID {userId}");
			}

			var userPosts = _posts.GetPostsByUserId(userId)
				.Where(post => !post.IsDeleted)
				.ToList();

			if (userPosts.Count == 0)
			{
				return Ok(new List<PostModel>());
			}

			return Ok(userPosts);
		}

		[HttpGet("category/{categoryId}", Name = "GetPostsByCategory")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public ActionResult<IEnumerable<PostModel>> GetPostsByCategory(int categoryId)
		{
			if (categoryId < 1)
			{
				return BadRequest($"Invalid category ID {categoryId}");
			}

			var categoryPosts = _posts.GetPostsByCategoryId(categoryId)
				.Where(post => !post.IsDeleted)
				.ToList();

			if (categoryPosts.Count == 0)
			{
				return Ok(new List<PostModel>());
			}

			return Ok(categoryPosts);
		}
	}
}
