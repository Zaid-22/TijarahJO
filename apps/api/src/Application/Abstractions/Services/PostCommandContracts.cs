using System.Threading;
using System.Threading.Tasks;
using TijarahJo.Application.Common;

namespace TijarahJo.Application.Abstractions.Services;

public sealed class CreatePostCommand
{
    public int ActorUserId { get; init; }
    public bool ActorIsAdmin { get; init; }
    public int CategoryId { get; init; }
    public string? Title { get; init; }
    public string? Description { get; init; }
    public decimal? Price { get; init; }
    public int? CityId { get; init; }
    public int? AreaId { get; init; }
}

public sealed class UpdatePostCommand
{
    public int PostId { get; init; }
    public int ActorUserId { get; init; }
    public bool ActorIsAdmin { get; init; }
    public int CategoryId { get; init; }
    public string? Title { get; init; }
    public string? Description { get; init; }
    public decimal? Price { get; init; }
    public int? CityId { get; init; }
    public int? AreaId { get; init; }
}

public enum PostMutationFailureReason
{
    InvalidRequest,
    Unauthorized,
    Forbidden,
    NotFound,
    InvalidStatus,
    PersistenceFailed
}

public sealed class PostMutationResult
{
    public bool Success { get; init; }
    public Post? Post { get; init; }
    public PostMutationFailureReason? FailureReason { get; init; }
    public string? Message { get; init; }
}

public interface IPostMutationService
{
    Task<PostMutationResult> CreateAsync(CreatePostCommand command, CancellationToken cancellationToken = default);
    Task<PostMutationResult> UpdateAsync(UpdatePostCommand command, CancellationToken cancellationToken = default);
    Task<PostMutationResult> DeleteAsync(int postId, int actorUserId, bool actorIsAdmin, CancellationToken cancellationToken = default);
}
