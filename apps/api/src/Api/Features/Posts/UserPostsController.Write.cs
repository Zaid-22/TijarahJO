using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models;
using System.Security.Claims;
using TijarahJoDB.Application.Common;
using TijarahJoDB.BLL;
using TijarahJoDBAPI.Contracts.Requests;

namespace TijarahJoDBAPI.Features.Posts
{
	public partial class UserPostsController
	{
		[Authorize]
		[HttpPost(Name = "AddPost")]
		[ProducesResponseType(StatusCodes.Status201Created)]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		public ActionResult<PostModel> AddPost(PostModel? newPostDTO)
		{
			// Extract user ID from JWT token
			var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
			if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int currentUserId))
			{
				return Unauthorized("Invalid authentication token.");
			}

				if (newPostDTO == null ||
					newPostDTO.CategoryID <= 0 ||
					string.IsNullOrWhiteSpace(newPostDTO.PostTitle) ||
					newPostDTO.Status < PostStatusPolicy.Active ||
					newPostDTO.Status > PostStatusPolicy.Sold)
				{
					return BadRequest("Invalid Post data.");
				}

			// Override UserID from token to prevent users from creating posts for other users
			newPostDTO.UserID = currentUserId;
			bool isAdmin = IsAdminUser(User);
			newPostDTO.PostTitle = newPostDTO.PostTitle.Trim();
			newPostDTO.PostDescription = string.IsNullOrWhiteSpace(newPostDTO.PostDescription)
				? string.Empty
				: newPostDTO.PostDescription.Trim();
			newPostDTO.CreatedAt = NormalizeSqlDateTime(newPostDTO.CreatedAt);
			newPostDTO.IsDeleted = false;
				newPostDTO.Status = isAdmin ? newPostDTO.Status : PostStatusPolicy.Active;

			Post post = _posts.Create(new PostModel
			(
					newPostDTO.PostID,
					newPostDTO.UserID,
					newPostDTO.CategoryID,
					newPostDTO.PostTitle,
					newPostDTO.PostDescription,
					newPostDTO.Price,
					newPostDTO.Status,
					newPostDTO.CreatedAt,
					newPostDTO.IsDeleted,
					0, // Views starts at 0
					newPostDTO.City,
					newPostDTO.Area
			));

			if (!_posts.Save(post))
			{
				_logger.LogWarning("Failed to save post for UserID {UserId}.", newPostDTO.UserID);
				return StatusCode(StatusCodes.Status500InternalServerError, "Error adding Post");
			}

			var createdPost = post.PostModel;

			return CreatedAtAction(nameof(GetPostById), new { id = createdPost.PostID }, createdPost);
		}

		[Authorize]
		[HttpPut("{id}", Name = "UpdatePost")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status403Forbidden)]
		public ActionResult<PostModel> UpdatePost(int id, PostModel? updatedPost)
		{
				if (id < 1 ||
					updatedPost == null ||
					updatedPost.CategoryID <= 0 ||
					string.IsNullOrWhiteSpace(updatedPost.PostTitle) ||
					updatedPost.Status < PostStatusPolicy.Active ||
					updatedPost.Status > PostStatusPolicy.Sold)
				{
					return BadRequest("Invalid Post data.");
				}

			// Extract user ID from JWT token
			var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
			if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int currentUserId))
			{
				return Unauthorized("Invalid authentication token.");
			}

			Post? post = _posts.Find(id);
			if (post == null)
			{
				return NotFound($"Post with ID {id} not found.");
			}

			bool isAdmin = IsAdminUser(User);

			// Security: Verify that the current user owns this post (unless admin)
			if (post.UserID != currentUserId && !isAdmin)
			{
				_logger.LogWarning(
					"User {CurrentUserId} attempted to update PostID {PostId} owned by UserID {OwnerUserId}.",
					currentUserId,
					id,
					post.UserID
				);
				return StatusCode(StatusCodes.Status403Forbidden, "You can only update your own posts.");
			}

			var normalizedTitle = updatedPost.PostTitle.Trim();
			var normalizedDescription = string.IsNullOrWhiteSpace(updatedPost.PostDescription)
				? string.Empty
				: updatedPost.PostDescription.Trim();

			// Only update allowed fields, preserve original UserID and CreatedAt
			post.CategoryID = updatedPost.CategoryID;
			post.PostTitle = normalizedTitle;
			post.PostDescription = normalizedDescription;
			post.Price = updatedPost.Price;
			if (isAdmin)
			{
				post.Status = updatedPost.Status;
			}
				else
				{
					// Users can only move their own non-moderated posts between ACTIVE and SOLD.
					// Moderation statuses (BLOCKED/DELETED) are admin-controlled.
					if (!PostStatusPolicy.IsModerationState(post.Status))
					{
						post.Status = updatedPost.Status == PostStatusPolicy.Sold
							? PostStatusPolicy.Sold
							: PostStatusPolicy.Active;
					}
				}
			post.IsDeleted = updatedPost.IsDeleted;
			post.City = updatedPost.City;
			post.Area = updatedPost.Area;
			// Do NOT update UserID or CreatedAt - preserve original values

			if (!_posts.Save(post))
			{
				return StatusCode(StatusCodes.Status500InternalServerError, "Error updating Post");
			}

			return Ok(post.PostModel);
		}

		[Authorize]
		[HttpDelete("{id}", Name = "DeletePost")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[ProducesResponseType(StatusCodes.Status403Forbidden)]
		[ProducesResponseType(StatusCodes.Status500InternalServerError)]
		public ActionResult DeletePost(int id)
		{
			if (id < 1)
			{
				return BadRequest($"Not accepted ID {id}");
			}

			// Extract user ID from JWT token
			var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
			if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int currentUserId))
			{
				return Unauthorized("Invalid authentication token.");
			}

			// Verify post exists before attempting deletion
			Post? post = _posts.Find(id);
			if (post == null)
			{
				return NotFound($"Post with ID {id} not found.");
			}

			// Security: Verify that the current user owns this post (unless admin)
			if (post.UserID != currentUserId && !IsAdminUser(User))
			{
				_logger.LogWarning(
					"User {CurrentUserId} attempted to delete PostID {PostId} owned by UserID {OwnerUserId}.",
					currentUserId,
					id,
					post.UserID
				);
				return StatusCode(StatusCodes.Status403Forbidden, "You can only delete your own posts.");
			}

				// Keep delete atomic at the persistence layer.
				// The repository handles dependent chat/image/favorite rows and post deletion in one transaction.
				try
			{
				if (_posts.DeletePost(id))
				{
					return Ok($"Post with ID {id} has been deleted.");
				}

				_logger.LogWarning("Post.DeletePost returned false for PostID {PostId}.", id);
				return StatusCode(StatusCodes.Status500InternalServerError, "Failed to delete post.");
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Unhandled exception while deleting PostID {PostId}.", id);
				return StatusCode(StatusCodes.Status500InternalServerError, "Error deleting post.");
			}
		}

		[Authorize]
		[HttpPatch("{id}/status", Name = "UpdatePostStatus")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status401Unauthorized)]
		[ProducesResponseType(StatusCodes.Status403Forbidden)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public ActionResult<PostModel> UpdatePostStatus(int id, [FromBody] UpdatePostStatusRequest request)
		{
			if (id < 1 || request == null || string.IsNullOrWhiteSpace(request.Status))
			{
				return BadRequest("Invalid request data.");
			}

			var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
			if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int currentUserId))
			{
				return Unauthorized("Invalid authentication token.");
			}

			Post? post = _posts.Find(id);
			if (post == null)
			{
				return NotFound($"Post with ID {id} not found.");
			}

			if (post.UserID != currentUserId && !IsAdminUser(User))
			{
				return StatusCode(StatusCodes.Status403Forbidden, "You can only update the status of your own posts.");
			}

				if (!PostStatusPolicy.TryParseApiStatus(request.Status, out int statusInt))
				{
					return BadRequest($"Invalid status. Allowed values: {PostStatusPolicy.AllowedApiStatuses}.");
				}

				bool isAdmin = IsAdminUser(User);
				if (!isAdmin)
				{
					// BLOCKED and DELETED are moderation states.
					if (PostStatusPolicy.IsModerationState(statusInt))
					{
						return StatusCode(StatusCodes.Status403Forbidden, "Only admins can set blocked or deleted status.");
					}

					// Non-admin users cannot clear moderation state once applied.
					if (PostStatusPolicy.IsModerationState(post.Status) && statusInt != post.Status)
					{
						return StatusCode(StatusCodes.Status403Forbidden, "Only admins can reactivate blocked or deleted posts.");
					}
				}

				if (post.Status == statusInt)
				{
					return Ok(post.PostModel);
				}

				post.Status = statusInt;

			if (!_posts.Save(post))
			{
				return StatusCode(StatusCodes.Status500InternalServerError, "Error updating post status");
			}

			return Ok(post.PostModel);
		}
	}
}
