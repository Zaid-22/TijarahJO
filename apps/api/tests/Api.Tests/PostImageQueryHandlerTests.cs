using TijarahJo.Domain.Models;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.Application.Services;
using TijarahJoDB.BLL;

namespace TijarahJoDBAPI.Tests;

public sealed class PostImageQueryHandlerTests
{
    [Fact]
    public async Task GetByPostIdAsync_ReturnsBadRequest_WhenPostIdInvalid()
    {
        var service = new FakePostImageService();
        var handler = new PostImageQueryHandler(service);

        PostImageListQueryResult result = await handler.GetByPostIdAsync(0);

        Assert.False(result.Success);
        Assert.Equal(400, result.StatusCode);
        Assert.Equal("Invalid post ID 0", result.Message);
    }

    [Fact]
    public async Task GetByPostIdAsync_FiltersDeletedAndOrdersImages()
    {
        DateTime now = DateTime.UtcNow;
        var service = new FakePostImageService
        {
            ImagesByPostId = new List<PostImageModel>
            {
                CreateImage(3, 10, now.AddMinutes(1), isDeleted: false),
                CreateImage(2, 10, now, isDeleted: false),
                CreateImage(1, 10, now.AddMinutes(-1), isDeleted: true)
            }
        };
        var handler = new PostImageQueryHandler(service);

        PostImageListQueryResult result = await handler.GetByPostIdAsync(10);

        Assert.True(result.Success);
        Assert.Equal(200, result.StatusCode);
        Assert.Equal(2, result.PostImages.Count);
        Assert.Equal(2, result.PostImages[0].PostImageID);
        Assert.Equal(3, result.PostImages[1].PostImageID);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNotFound_WhenImageMissing()
    {
        var service = new FakePostImageService
        {
            NextFindResult = null
        };
        var handler = new PostImageQueryHandler(service);

        PostImageByIdQueryResult result = await handler.GetByIdAsync(42);

        Assert.False(result.Success);
        Assert.Equal(404, result.StatusCode);
        Assert.Equal("PostImage with ID 42 not found.", result.Message);
    }

    [Fact]
    public async Task GetAllAsync_FiltersDeletedImages()
    {
        DateTime now = DateTime.UtcNow;
        var service = new FakePostImageService
        {
            AllImages = new List<PostImageModel>
            {
                CreateImage(1, 12, now, isDeleted: false),
                CreateImage(2, 12, now, isDeleted: true)
            }
        };
        var handler = new PostImageQueryHandler(service);

        PostImageListQueryResult result = await handler.GetAllAsync();

        Assert.True(result.Success);
        Assert.Single(result.PostImages);
        Assert.Equal(1, result.PostImages[0].PostImageID);
    }

    [Fact]
    public async Task ExistsAsync_ReturnsBadRequest_WhenIdInvalid()
    {
        var service = new FakePostImageService();
        var handler = new PostImageQueryHandler(service);

        PostImageExistsQueryResult result = await handler.ExistsAsync(0);

        Assert.False(result.Success);
        Assert.Equal(400, result.StatusCode);
        Assert.Equal("Not accepted ID 0", result.Message);
    }

    private static PostImageModel CreateImage(int id, int postId, DateTime uploadedAt, bool isDeleted)
    {
        return new PostImageModel(
            postimageid: id,
            postid: postId,
            postimageurl: $"https://example.com/{id}.jpg",
            uploadedat: uploadedAt,
            isdeleted: isDeleted
        );
    }

    private sealed class FakePostImageService : IPostImageService
    {
        public IReadOnlyList<PostImageModel> AllImages { get; set; } = Array.Empty<PostImageModel>();
        public IReadOnlyList<PostImageModel> ImagesByPostId { get; set; } = Array.Empty<PostImageModel>();
        public PostImage? NextFindResult { get; set; } = new PostImage(CreateImage(1, 1, DateTime.UtcNow, isDeleted: false), PostImage.ModeType.Update);
        public bool NextExists { get; set; } = true;

        public Task<PostImage?> FindAsync(int? postImageId, CancellationToken cancellationToken = default)
            => Task.FromResult(NextFindResult);

        public PostImage Create(PostImageModel model) => new(model);

        public Task<bool> SaveAsync(PostImage postImage, CancellationToken cancellationToken = default)
            => Task.FromResult(true);

        public Task<bool> DeletePostImageAsync(int? postImageId, CancellationToken cancellationToken = default)
            => Task.FromResult(true);

        public Task<bool> DoesPostImageExistAsync(int? postImageId, CancellationToken cancellationToken = default)
            => Task.FromResult(NextExists);

        public Task<IReadOnlyList<PostImageModel>> GetAllPostImagesAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
            => Task.FromResult(AllImages);

        public Task<IReadOnlyList<PostImageModel>> GetPostImagesByPostIdAsync(int postId, CancellationToken cancellationToken = default)
            => Task.FromResult(ImagesByPostId);
    }
}
