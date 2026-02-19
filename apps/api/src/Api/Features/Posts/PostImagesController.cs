using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models;
using System.Security.Claims;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.BLL;

namespace TijarahJoDBAPI.Features.Posts
{
    [ApiController]
    [Route("api/post-images")]
    public class PostImagesController : ControllerBase
    {
        private readonly ILogger<PostImagesController> _logger;
        private readonly IPostService _posts;
        private readonly IPostImageService _postImages;

        public PostImagesController(
            ILogger<PostImagesController> logger,
            IPostService posts,
            IPostImageService postImages)
        {
            _logger = logger;
            _posts = posts;
            _postImages = postImages;
        }

        private static bool IsAdminUser(ClaimsPrincipal user)
        {
            var roleClaim = user.FindFirst(ClaimTypes.Role)?.Value;
            return int.TryParse(roleClaim, out int roleId) && roleId == 1;
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out int currentUserId) ? currentUserId : null;
        }

        private static readonly DateTime SqlDateTimeMinUtc = new(1753, 1, 1, 0, 0, 0, DateTimeKind.Utc);

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
        public ActionResult<IEnumerable<PostImageModel>> GetAllPostImages()
        {
            var postImages = _postImages.GetAllPostImages();

            if (postImages == null || postImages.Count == 0)
            {
                return Ok(new List<PostImageModel>());
            }

            var dtoList = postImages.Where(image => !image.IsDeleted).ToList();

            _logger.LogDebug("Returning {Count} non-deleted post images.", dtoList.Count);
            return Ok(dtoList);
        }

        [HttpGet("post/{postId:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public ActionResult<IEnumerable<PostImageModel>> GetPostImagesByPostId(int postId)
        {
            if (postId < 1)
            {
                return BadRequest($"Invalid post ID {postId}");
            }

            var images = _postImages
                .GetPostImagesByPostId(postId)
                .Where(image => !image.IsDeleted)
                .OrderBy(image => image.UploadedAt)
                .ThenBy(image => image.PostImageID)
                .ToList();

            return Ok(images);
        }

        [HttpGet("{id:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult<PostImageModel> GetPostImageById(int id)
        {
            if (id < 1)
            {
                return BadRequest($"Not accepted ID {id}");
            }

            PostImage? postimage = _postImages.Find(id);
            if (postimage == null)
            {
                return NotFound($"PostImage with ID {id} not found.");
            }

            return Ok(postimage.PostImageModel);
        }

        [Authorize]
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult<PostImageModel> AddPostImage(PostImageModel? newPostImageDTO)
        {
            if (newPostImageDTO == null || newPostImageDTO.PostID <= 0 || string.IsNullOrWhiteSpace(newPostImageDTO.PostImageURL))
            {
                return BadRequest("Invalid PostImage data.");
            }

            int? currentUserId = GetCurrentUserId();
            if (currentUserId == null)
            {
                return Unauthorized("Invalid authentication token.");
            }

            Post? post = _posts.Find(newPostImageDTO.PostID);
            if (post == null)
            {
                return NotFound($"Post with ID {newPostImageDTO.PostID} not found.");
            }
            if (post.IsDeleted)
            {
                return BadRequest("Cannot add images to a deleted post.");
            }

            if (post.UserID != currentUserId.Value && !IsAdminUser(User))
            {
                return StatusCode(StatusCodes.Status403Forbidden, "You can only add images to your own posts.");
            }

            newPostImageDTO.PostImageURL = newPostImageDTO.PostImageURL.Trim();
            newPostImageDTO.UploadedAt = NormalizeSqlDateTime(newPostImageDTO.UploadedAt);
            newPostImageDTO.IsDeleted = false;

            PostImage postimage = _postImages.Create(new PostImageModel
            (
                newPostImageDTO.PostImageID,
                newPostImageDTO.PostID,
                newPostImageDTO.PostImageURL,
                newPostImageDTO.UploadedAt,
                newPostImageDTO.IsDeleted
            ));

            try
            {
                if (!_postImages.Save(postimage))
                {
                    _logger.LogWarning("Failed to save post image for PostID {PostId}.", newPostImageDTO.PostID);
                    return StatusCode(StatusCodes.Status500InternalServerError, "Error adding PostImage");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception while saving post image for PostID {PostId}.", newPostImageDTO.PostID);
                return StatusCode(StatusCodes.Status500InternalServerError, "Error adding PostImage");
            }

            newPostImageDTO.PostImageID = postimage.PostImageID;
            return CreatedAtAction(nameof(GetPostImageById), new { id = newPostImageDTO.PostImageID }, newPostImageDTO);
        }

        [Authorize]
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult<PostImageModel> UpdatePostImage(int id, PostImageModel? updatedPostImage)
        {
            if (id < 1 || updatedPostImage == null || updatedPostImage.PostID <= 0 || string.IsNullOrWhiteSpace(updatedPostImage.PostImageURL))
            {
                return BadRequest("Invalid PostImage data.");
            }

            int? currentUserId = GetCurrentUserId();
            if (currentUserId == null)
            {
                return Unauthorized("Invalid authentication token.");
            }

            updatedPostImage.PostImageURL = updatedPostImage.PostImageURL.Trim();

            PostImage? postimage = _postImages.Find(id);
            if (postimage == null)
            {
                return NotFound($"PostImage with ID {id} not found.");
            }

            Post? post = _posts.Find(postimage.PostID);
            if (post == null)
            {
                return NotFound($"Post with ID {postimage.PostID} not found.");
            }
            if (post.IsDeleted)
            {
                return BadRequest("Cannot update images on a deleted post.");
            }

            if (post.UserID != currentUserId.Value && !IsAdminUser(User))
            {
                return StatusCode(StatusCodes.Status403Forbidden, "You can only update images on your own posts.");
            }

            if (updatedPostImage.PostID != postimage.PostID)
            {
                return BadRequest("Moving an image to another post is not allowed.");
            }

            postimage.PostImageURL = updatedPostImage.PostImageURL;
            postimage.UploadedAt = NormalizeSqlDateTime(updatedPostImage.UploadedAt, postimage.UploadedAt);
            postimage.IsDeleted = updatedPostImage.IsDeleted;

            if (!_postImages.Save(postimage))
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Error updating PostImage");
            }

            return Ok(postimage.PostImageModel);
        }

        [Authorize]
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult DeletePostImage(int id)
        {
            if (id < 1)
            {
                return BadRequest($"Not accepted ID {id}");
            }

            int? currentUserId = GetCurrentUserId();
            if (currentUserId == null)
            {
                return Unauthorized("Invalid authentication token.");
            }

            PostImage? postimage = _postImages.Find(id);
            if (postimage == null)
            {
                return NotFound($"PostImage with ID {id} not found.");
            }

            Post? post = _posts.Find(postimage.PostID);
            if (post == null)
            {
                return NotFound($"Post with ID {postimage.PostID} not found.");
            }
            if (post.IsDeleted)
            {
                return BadRequest("Cannot delete images from a deleted post.");
            }

            if (post.UserID != currentUserId.Value && !IsAdminUser(User))
            {
                return StatusCode(StatusCodes.Status403Forbidden, "You can only delete images from your own posts.");
            }

            if (_postImages.DeletePostImage(id))
            {
                return Ok($"PostImage with ID {id} has been deleted.");
            }

            return NotFound($"PostImage with ID {id} not found. No rows deleted!");
        }

        [HttpGet("Exists/{id:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public ActionResult<bool> DoesPostImageExist(int id)
        {
            if (id < 1)
            {
                return BadRequest($"Not accepted ID {id}");
            }

            bool exists = _postImages.DoesPostImageExist(id);
            return Ok(exists);
        }
    }
}
