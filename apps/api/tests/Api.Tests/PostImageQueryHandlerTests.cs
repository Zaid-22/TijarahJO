using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Services;
using TijarahJo.Application.Common;

namespace TijarahJo.Api.Tests;

public sealed class PostImageQueryHandlerTests
{
    [Fact]
    public async Task GetByPostIdAsync_ReturnsBadRequest_WhenPostIdInvalid()
    {
        var service = new FakePostImageService();
        var handler = new PostImageQueryHandler(service, new FakePostReadService());

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
        var handler = new PostImageQueryHandler(service, new FakePostReadService());

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
        var handler = new PostImageQueryHandler(service, new FakePostReadService());

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
        var handler = new PostImageQueryHandler(service, new FakePostReadService());

        PostImageListQueryResult result = await handler.GetAllAsync();

        Assert.True(result.Success);
        Assert.Single(result.PostImages);
        Assert.Equal(1, result.PostImages[0].PostImageID);
    }

    [Fact]
    public async Task ExistsAsync_ReturnsBadRequest_WhenIdInvalid()
    {
        var service = new FakePostImageService();
        var handler = new PostImageQueryHandler(service, new FakePostReadService());

        PostImageExistsQueryResult result = await handler.ExistsAsync(0);

        Assert.False(result.Success);
        Assert.Equal(400, result.StatusCode);
        Assert.Equal("Not accepted ID 0", result.Message);
    }

    [Fact]
    public async Task GetByPostIdAsync_ReturnsNotFound_WhenParentPostIsNotPublic()
    {
        var service = new FakePostImageService
        {
            ImagesByPostId = [CreateImage(1, 10, DateTime.UtcNow, isDeleted: false)]
        };
        var postReads = new FakePostReadService
        {
            NextGetByIdResult = new PostReadResult
            {
                Success = false,
                FailureReason = PostReadFailureReason.NotFound,
                Message = "Post with ID 10 not found."
            }
        };
        var handler = new PostImageQueryHandler(service, postReads);

        PostImageListQueryResult result = await handler.GetByPostIdAsync(10);

        Assert.False(result.Success);
        Assert.Equal(404, result.StatusCode);
        Assert.Equal(0, service.GetByPostIdCalls);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNotFound_WhenImageIsDeleted()
    {
        var service = new FakePostImageService
        {
            NextFindResult = new PostImage(
                CreateImage(7, 10, DateTime.UtcNow, isDeleted: true),
                PostImage.ModeType.Update)
        };
        var handler = new PostImageQueryHandler(service, new FakePostReadService());

        PostImageByIdQueryResult result = await handler.GetByIdAsync(7);

        Assert.False(result.Success);
        Assert.Equal(404, result.StatusCode);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNotFound_WhenParentPostIsNotPublic()
    {
        var service = new FakePostImageService
        {
            NextFindResult = new PostImage(
                CreateImage(7, 10, DateTime.UtcNow, isDeleted: false),
                PostImage.ModeType.Update)
        };
        var postReads = new FakePostReadService
        {
            NextGetByIdResult = new PostReadResult
            {
                Success = false,
                FailureReason = PostReadFailureReason.NotFound
            }
        };
        var handler = new PostImageQueryHandler(service, postReads);

        PostImageByIdQueryResult result = await handler.GetByIdAsync(7);

        Assert.False(result.Success);
        Assert.Equal(404, result.StatusCode);
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
        public int GetByPostIdCalls { get; private set; }

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
        {
            GetByPostIdCalls++;
            return Task.FromResult(ImagesByPostId);
        }
    }

    private sealed class FakePostReadService : IPostReadService
    {
        public PostReadResult NextGetByIdResult { get; set; } = new()
        {
            Success = true,
            Post = new Post(
                new PostModel(
                    1,
                    1,
                    1,
                    "Visible post",
                    "Description",
                    1m,
                    PostStatusPolicy.Active,
                    DateTime.UtcNow,
                    false,
                    0,
                    null,
                    null),
                Post.ModeType.Update)
        };

        public Task<PostReadResult> GetByIdAsync(int postId, CancellationToken cancellationToken = default)
            => Task.FromResult(NextGetByIdResult);

        public Task<PostExistsResult> ExistsAsync(int postId, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();

        public Task<PostReadCollectionResult> GetByUserIdAsync(int userId, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();

        public Task<PostReadCollectionResult> GetByCategoryIdAsync(int categoryId, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();

        public Task<PostViewIncrementResult> IncrementViewsAsync(int postId, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();
    }
}
