using Models;
using TijarahJoDB.Application.Abstractions.DataAccess;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.BLL;

namespace TijarahJoDB.Application.Services;

public sealed class PostImageService : IPostImageService
{
    private readonly IPostImageDataAccess _postImages;

    public PostImageService(IPostImageDataAccess postImages)
    {
        _postImages = postImages;
    }

    public async Task<PostImage?> FindAsync(int? postImageId, CancellationToken cancellationToken = default)
    {
        PostImageModel postImageModel = await _postImages.GetPostImageByIDAsync(postImageId, cancellationToken);
        return postImageModel == null
            ? null
            : new PostImage(postImageModel, PostImage.ModeType.Update);
    }

    public PostImage Create(PostImageModel model) => new(model);

    public async Task<bool> SaveAsync(PostImage postImage, CancellationToken cancellationToken = default)
    {
        if (postImage.Mode == PostImage.ModeType.AddNew)
        {
            int postImageId = await _postImages.AddPostImageAsync(postImage.PostImageModel, cancellationToken);
            if (postImageId <= 0)
            {
                return false;
            }

            postImage.PostImageID = postImageId;
            postImage.Mode = PostImage.ModeType.Update;
            return true;
        }

        return await _postImages.UpdatePostImageAsync(postImage.PostImageModel, cancellationToken);
    }

    public Task<bool> DeletePostImageAsync(int? postImageId, CancellationToken cancellationToken = default)
        => _postImages.DeletePostImageAsync(postImageId, cancellationToken);

    public Task<bool> DoesPostImageExistAsync(int? postImageId, CancellationToken cancellationToken = default)
        => _postImages.DoesPostImageExistAsync(postImageId, cancellationToken);

    public Task<IReadOnlyList<PostImageModel>> GetAllPostImagesAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
        => _postImages.GetAllPostImagesAsync(pageNumber, pageSize, cancellationToken);

    public Task<IReadOnlyList<PostImageModel>> GetPostImagesByPostIdAsync(int postId, CancellationToken cancellationToken = default)
        => _postImages.GetPostImagesByPostIDAsync(postId, cancellationToken);
}
