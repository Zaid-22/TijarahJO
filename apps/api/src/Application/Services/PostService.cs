using TijarahJo.Domain.Models;
using TijarahJoDB.Application.Abstractions.DataAccess;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.BLL;

namespace TijarahJoDB.Application.Services;

public sealed class PostService : IPostService
{
    private readonly IPostDataAccess _posts;

    public PostService(IPostDataAccess posts)
    {
        _posts = posts;
    }

    public async Task<Post?> FindAsync(int? postId, CancellationToken cancellationToken = default)
    {
        PostModel? postModel = await _posts.GetPostByIDAsync(postId, cancellationToken);
        return postModel == null ? null : new Post(postModel, Post.ModeType.Update);
    }

    public Post Create(PostModel model) => new(model);

    public async Task<bool> SaveAsync(Post post, CancellationToken cancellationToken = default)
    {
        if (post.Mode == Post.ModeType.AddNew)
        {
            int postId = await _posts.AddPostAsync(post.PostModel, cancellationToken);
            if (postId <= 0)
            {
                return false;
            }

            post.PostID = postId;
            post.Mode = Post.ModeType.Update;
            return true;
        }

        return await _posts.UpdatePostAsync(post.PostModel, cancellationToken);
    }

    public Task<bool> DeletePostAsync(int? postId, int actorUserId, CancellationToken cancellationToken = default)
        => _posts.DeletePostAsync(postId, actorUserId, cancellationToken);

    public Task<bool> DoesPostExistAsync(int? postId, CancellationToken cancellationToken = default)
        => _posts.DoesPostExistAsync(postId, cancellationToken);

    public Task<bool> IncrementViewsAsync(int? postId, CancellationToken cancellationToken = default)
        => _posts.IncrementPostViewsAsync(postId, cancellationToken);

    public Task<IReadOnlyList<PostModel>> GetPostsByUserIdAsync(int userId, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
        => _posts.GetPostsByUserIDAsync(userId, pageNumber, pageSize, cancellationToken);

    public Task<IReadOnlyList<PostModel>> GetPostsByCategoryIdAsync(int categoryId, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
        => _posts.GetPostsByCategoryIDAsync(categoryId, pageNumber, pageSize, cancellationToken);
}
