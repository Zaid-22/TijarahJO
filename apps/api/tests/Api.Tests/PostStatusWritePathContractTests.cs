using TijarahJo.Domain.Models;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.Application.Common;
using TijarahJoDB.Application.Services;
using TijarahJoDB.BLL;
using TijarahJo.Api.Contracts.Requests;

namespace TijarahJo.Api.Tests;

public sealed class PostStatusWritePathContractTests
{
    [Fact]
    public void CreatePostRequest_DoesNotExposeStatusField()
    {
        Assert.Null(typeof(CreatePostRequest).GetProperty("Status"));
    }

    [Fact]
    public void UpdatePostRequest_DoesNotExposeStatusField()
    {
        Assert.Null(typeof(UpdatePostRequest).GetProperty("Status"));
    }

    [Fact]
    public void CreatePostCommand_DoesNotExposeRequestedStatusField()
    {
        Assert.Null(typeof(CreatePostCommand).GetProperty("RequestedStatus"));
    }

    [Fact]
    public void UpdatePostCommand_DoesNotExposeRequestedStatusField()
    {
        Assert.Null(typeof(UpdatePostCommand).GetProperty("RequestedStatus"));
    }

    [Fact]
    public void PostStatusPolicy_RejectsLegacyDeletedStatusForPersistence()
    {
        Assert.True(PostStatusPolicy.IsAllowedPersistedStatus(PostStatusPolicy.Active));
        Assert.True(PostStatusPolicy.IsAllowedPersistedStatus(PostStatusPolicy.Blocked));
        Assert.True(PostStatusPolicy.IsAllowedPersistedStatus(PostStatusPolicy.Sold));
        Assert.False(PostStatusPolicy.IsAllowedPersistedStatus(2));
    }

    [Fact]
    public async Task PostMutationService_CreateAsync_AlwaysCreatesActiveStatus()
    {
        var posts = new FakePostService();
        var service = new PostMutationService(posts);

        PostMutationResult result = await service.CreateAsync(new CreatePostCommand
        {
            ActorUserId = 7,
            ActorIsAdmin = true,
            CategoryId = 3,
            Title = "Test post",
            Description = "description",
            Price = 99.5m
        });

        Assert.True(result.Success);
        Assert.NotNull(result.Post);
        Assert.Equal(PostStatusPolicy.Active, result.Post!.Status);
    }

    [Fact]
    public async Task PostMutationService_UpdateAsync_DoesNotMutateExistingStatus()
    {
        var existing = new Post(new PostModel(
            postid: 41,
            userid: 12,
            categoryid: 5,
            posttitle: "Old title",
            postdescription: "Old description",
            price: 10m,
            status: PostStatusPolicy.Sold,
            createdat: DateTime.UtcNow,
            isdeleted: false
        ), Post.ModeType.Update);

        var posts = new FakePostService { NextFindPost = existing };
        var service = new PostMutationService(posts);

        PostMutationResult result = await service.UpdateAsync(new UpdatePostCommand
        {
            PostId = 41,
            ActorUserId = 12,
            ActorIsAdmin = false,
            CategoryId = 9,
            Title = "New title",
            Description = "New description",
            Price = 55m
        });

        Assert.True(result.Success);
        Assert.NotNull(result.Post);
        Assert.Equal(PostStatusPolicy.Sold, result.Post!.Status);
    }

    private sealed class FakePostService : IPostService
    {
        public Post? NextFindPost { get; set; }

        public Task<Post?> FindAsync(int? postId, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(NextFindPost);
        }

        public Post Create(PostModel model)
        {
            return new Post(model);
        }

        public Task<bool> SaveAsync(Post post, CancellationToken cancellationToken = default)
        {
            if (post.Mode == Post.ModeType.AddNew)
            {
                post.PostID = 500;
                post.Mode = Post.ModeType.Update;
            }

            NextFindPost = post;
            return Task.FromResult(true);
        }

        public Task<bool> DeletePostAsync(int? postId, int actorUserId, CancellationToken cancellationToken = default)
            => Task.FromResult(true);

        public Task<bool> DoesPostExistAsync(int? postId, CancellationToken cancellationToken = default)
            => Task.FromResult(true);

        public Task<bool> IncrementViewsAsync(int? postId, CancellationToken cancellationToken = default)
            => Task.FromResult(true);

        public Task<IReadOnlyList<PostModel>> GetPostsByUserIdAsync(int userId, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<PostModel>>(Array.Empty<PostModel>());

        public Task<IReadOnlyList<PostModel>> GetPostsByCategoryIdAsync(int categoryId, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<PostModel>>(Array.Empty<PostModel>());
    }
}
