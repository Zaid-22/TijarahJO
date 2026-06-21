using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Api.Common.Configuration;
using TijarahJo.Api.Common.Services;
using TijarahJo.Api.Common.Utils;
using TijarahJo.Api.Contracts.Requests;
using TijarahJo.Api.Contracts.Responses;

namespace TijarahJo.Api.Features.Posts;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/post-images")]
public class PostImagesController(
    ILogger<PostImagesController> logger,
    IPostImageQueryHandler postImageQueries,
    IPostImageCommandService postImageCommands,
    IPostImageFileStorageService postImageStorage,
    IImageModerationService imageModeration,
    IWebHostEnvironment environment,
    IOptions<FileStorageOptions> fileStorageOptions) : ControllerBase
{
    private readonly FileStorageOptions _fileStorageOptions = fileStorageOptions.Value;

    [HttpGet("")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<PostImageResponseDTO>>> GetAllPostImages(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        PostImageListQueryResult result = await postImageQueries.GetAllAsync(page, pageSize, HttpContext.RequestAborted);
        if (!result.Success)
        {
            return this.ToPostImageListQueryProblem(result, "Failed to fetch post images.");
        }

        if (result.PostImages.Count == 0)
        {
            return Ok(Array.Empty<PostImageResponseDTO>());
        }

        List<PostImageResponseDTO> dtoList = [.. result.PostImages
            .Select(postImage => DTOMapper.ToPostImageResponseDTO(
                postImage,
                environment.ContentRootPath,
                _fileStorageOptions))];

        if (logger.IsEnabled(LogLevel.Debug))
        {
            logger.LogDebug("Returning {Count} non-deleted post images.", dtoList.Count);
        }
        return Ok(dtoList);
    }

    [HttpGet("post/{postId:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<PostImageResponseDTO>>> GetPostImagesByPostId(int postId)
    {
        PostImageListQueryResult result = await postImageQueries.GetByPostIdAsync(postId, HttpContext.RequestAborted);
        if (!result.Success)
        {
            return this.ToPostImageListQueryProblem(result, "Failed to fetch post images.");
        }

        List<PostImageResponseDTO> images = [.. result.PostImages
            .Select(postImage => DTOMapper.ToPostImageResponseDTO(
                postImage,
                environment.ContentRootPath,
                _fileStorageOptions))];

        return Ok(images);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PostImageResponseDTO>> GetPostImageById(int id)
    {
        PostImageByIdQueryResult result = await postImageQueries.GetByIdAsync(id, HttpContext.RequestAborted);
        if (!result.Success || result.PostImage == null)
        {
            return this.ToPostImageByIdQueryProblem(result, "Failed to fetch post image.");
        }

        return Ok(DTOMapper.ToPostImageResponseDTO(
            result.PostImage,
            environment.ContentRootPath,
            _fileStorageOptions));
    }

    [Authorize]
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PostImageResponseDTO>> AddPostImage([FromBody] CreatePostImageRequest request)
    {
        if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int currentUserId, out ActionResult? failureResult))
        {
            return failureResult!;
        }

        PostImageCommandResult result = await postImageCommands.CreateAsync(
            currentUserId,
            ApiControllerHelpers.IsAdminUser(User),
            request.PostID,
            request.PostImageURL,
            request.UploadedAt,
            HttpContext.RequestAborted
        );
        if (!result.Success || result.PostImage == null)
        {
            logger.LogWarning("Post image creation failed for PostID {PostId}. Reason: {Reason}", request.PostID, result.FailureReason);
            return this.ToPostImageCommandProblem(result, "Post image creation failed.");
        }

        return CreatedAtAction(
            nameof(GetPostImageById),
            new { id = result.PostImage.PostImageID },
            DTOMapper.ToPostImageResponseDTO(
                result.PostImage.PostImageModel,
                environment.ContentRootPath,
                _fileStorageOptions)
        );
    }

    [Authorize]
    [HttpPost("validate")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult> ValidatePostImage([FromForm] IFormFile file)
    {
        if (file == null)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Image file is required.");
        }

        try
        {
            postImageStorage.ValidateFileOrThrow(file);
        }
        catch (ArgumentException ex)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: ex.Message);
        }

        ModerationResult moderationResult = await imageModeration.CheckImageAsync(file);
        if (moderationResult.IsUnavailable)
        {
            return Problem(
                statusCode: StatusCodes.Status503ServiceUnavailable,
                detail: moderationResult.FailureReason ?? "Image moderation service is unavailable."
            );
        }

        if (moderationResult.IsFlagged)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Image rejected by moderation filters (inappropriate content detected).");
        }

        return Ok(new { Safe = true });
    }

    [Authorize]
    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PostImageUploadResponseDTO>> UploadPostImage([FromForm] UploadPostImageFileRequest request)
    {
        if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int currentUserId, out ActionResult? failureResult))
        {
            return failureResult!;
        }

        if (request.File == null)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Image file is required.");
        }

        try
        {
            postImageStorage.ValidateFileOrThrow(request.File);
        }
        catch (ArgumentException ex)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: ex.Message);
        }

        ModerationResult moderationResult = await imageModeration.CheckImageAsync(request.File);
        if (moderationResult.IsUnavailable)
        {
            return Problem(
                statusCode: StatusCodes.Status503ServiceUnavailable,
                detail: moderationResult.FailureReason ?? "Image moderation service is unavailable."
            );
        }

        if (moderationResult.IsFlagged)
        {
            logger.LogWarning("User {UserId} attempted to upload a flagged image (Adult: {Adult}, Violence: {Violence}).", currentUserId, moderationResult.RawAdult, moderationResult.RawViolence);
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Image rejected by moderation filters (inappropriate content detected).");
        }

        StoredPostImageFile storedFile;
        try
        {
            storedFile = await postImageStorage.SaveAsync(request.File, HttpContext.RequestAborted);
        }
        catch (ArgumentException ex)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: ex.Message);
        }

        PostImageCommandResult result = await postImageCommands.CreateAsync(
            currentUserId,
            ApiControllerHelpers.IsAdminUser(User),
            request.PostID,
            storedFile.PublicUrl,
            DateTime.UtcNow,
            HttpContext.RequestAborted
        );
        if (!result.Success || result.PostImage == null)
        {
            await postImageStorage.DeleteByPublicUrlAsync(storedFile.PublicUrl, HttpContext.RequestAborted);
            logger.LogWarning(
                "Post image upload failed to persist metadata for PostID {PostId}. Reason: {Reason}",
                request.PostID,
                result.FailureReason
            );
            return this.ToPostImageCommandProblem(result, "Post image upload failed.");
        }

        PostImageResponseDTO postImageDto = DTOMapper.ToPostImageResponseDTO(
            result.PostImage.PostImageModel,
            environment.ContentRootPath,
            _fileStorageOptions);
        return CreatedAtAction(
            nameof(GetPostImageById),
            new { id = result.PostImage.PostImageID },
            new PostImageUploadResponseDTO
            {
                Url = postImageDto.PostImageURL,
                PostImage = postImageDto
            }
        );
    }

    [Authorize]
    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PostImageResponseDTO>> UpdatePostImage(int id, [FromBody] UpdatePostImageRequest request)
    {
        if (id < 1)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Invalid PostImage data.");
        }

        if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int currentUserId, out ActionResult? failureResult))
        {
            return failureResult!;
        }

        PostImageCommandResult result = await postImageCommands.UpdateAsync(
            currentUserId,
            ApiControllerHelpers.IsAdminUser(User),
            id,
            request.PostID,
            request.PostImageURL,
            request.UploadedAt,
            HttpContext.RequestAborted
        );
        if (!result.Success || result.PostImage == null)
        {
            logger.LogWarning("Post image update failed for PostImageID {PostImageId}. Reason: {Reason}", id, result.FailureReason);
            return this.ToPostImageCommandProblem(result, "Post image update failed.");
        }

        return Ok(DTOMapper.ToPostImageResponseDTO(
            result.PostImage.PostImageModel,
            environment.ContentRootPath,
            _fileStorageOptions));
    }

    [Authorize]
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeletePostImage(int id)
    {
        if (id < 1)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: $"Not accepted ID {id}");
        }

        if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int currentUserId, out ActionResult? failureResult))
        {
            return failureResult!;
        }

        PostImageCommandResult result = await postImageCommands.DeleteAsync(
            currentUserId,
            ApiControllerHelpers.IsAdminUser(User),
            id,
            HttpContext.RequestAborted
        );
        if (!result.Success)
        {
            logger.LogWarning("Post image deletion failed for PostImageID {PostImageId}. Reason: {Reason}", id, result.FailureReason);
            return this.ToPostImageCommandProblem(result, "Post image deletion failed.");
        }

        return Ok(new ApiMessageResponse { Message = $"PostImage with ID {id} has been deleted." });
    }

    [HttpGet("Exists/{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<bool>> DoesPostImageExist(int id)
    {
        PostImageExistsQueryResult result = await postImageQueries.ExistsAsync(id, HttpContext.RequestAborted);
        if (!result.Success)
        {
            return this.ToPostImageExistsQueryProblem(result, "Failed to check post image existence.");
        }

        return Ok(result.Exists);
    }
}
