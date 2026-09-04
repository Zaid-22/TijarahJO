using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Application.Services;

public sealed class PostImageQueryHandler : IPostImageQueryHandler
{
    private readonly IPostImageService _postImages;
    private readonly IPostReadService _postReads;

    public PostImageQueryHandler(IPostImageService postImages, IPostReadService postReads)
    {
        _postImages = postImages;
        _postReads = postReads;
    }

    public async Task<PostImageListQueryResult> GetAllAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
    {
        IReadOnlyList<PostImageModel> models = await _postImages.GetAllPostImagesAsync(pageNumber, pageSize, cancellationToken);
        List<PostImageModel> visible = models
            .Where(image => !image.IsDeleted)
            .ToList();

        return new PostImageListQueryResult
        {
            Success = true,
            StatusCode = 200,
            PostImages = visible
        };
    }

    public async Task<PostImageListQueryResult> GetByPostIdAsync(int postId, CancellationToken cancellationToken = default)
    {
        if (postId < 1)
        {
            return new PostImageListQueryResult
            {
                Success = false,
                StatusCode = 400,
                Message = $"Invalid post ID {postId}"
            };
        }

        PostReadResult postResult = await _postReads.GetByIdAsync(postId, cancellationToken);
        if (!postResult.Success || postResult.Post == null)
        {
            return new PostImageListQueryResult
            {
                Success = false,
                StatusCode = ToStatusCode(postResult.FailureReason),
                Message = postResult.Message ?? $"Post with ID {postId} not found."
            };
        }

        List<PostImageModel> images = (await _postImages.GetPostImagesByPostIdAsync(postId, cancellationToken))
            .Where(image => !image.IsDeleted)
            .OrderBy(image => image.UploadedAt)
            .ThenBy(image => image.PostImageID)
            .ToList();

        return new PostImageListQueryResult
        {
            Success = true,
            StatusCode = 200,
            PostImages = images
        };
    }

    public async Task<PostImageByIdQueryResult> GetByIdAsync(int postImageId, CancellationToken cancellationToken = default)
    {
        if (postImageId < 1)
        {
            return new PostImageByIdQueryResult
            {
                Success = false,
                StatusCode = 400,
                Message = $"Not accepted ID {postImageId}"
            };
        }

        var postImage = await _postImages.FindAsync(postImageId, cancellationToken);
        if (postImage == null || postImage.IsDeleted)
        {
            return new PostImageByIdQueryResult
            {
                Success = false,
                StatusCode = 404,
                Message = $"PostImage with ID {postImageId} not found."
            };
        }
        PostReadResult postResult = await _postReads.GetByIdAsync(postImage.PostID, cancellationToken);
        if (!postResult.Success || postResult.Post == null)
        {
            return new PostImageByIdQueryResult
            {
                Success = false,
                StatusCode = ToStatusCode(postResult.FailureReason),
                Message = postResult.Message ?? $"PostImage with ID {postImageId} not found."
            };
        }

        return new PostImageByIdQueryResult
        {
            Success = true,
            StatusCode = 200,
            PostImage = postImage.PostImageModel
        };
    }

    public async Task<PostImageExistsQueryResult> ExistsAsync(int postImageId, CancellationToken cancellationToken = default)
    {
        if (postImageId < 1)
        {
            return new PostImageExistsQueryResult
            {
                Success = false,
                StatusCode = 400,
                Message = $"Not accepted ID {postImageId}"
            };
        }

        bool exists = await _postImages.DoesPostImageExistAsync(postImageId, cancellationToken);
        return new PostImageExistsQueryResult
        {
            Success = true,
            StatusCode = 200,
            Exists = exists
        };
    }

    private static int ToStatusCode(PostReadFailureReason? failureReason) => failureReason switch
    {
        PostReadFailureReason.InvalidRequest => 400,
        PostReadFailureReason.NotFound => 404,
        _ => 500
    };
}
