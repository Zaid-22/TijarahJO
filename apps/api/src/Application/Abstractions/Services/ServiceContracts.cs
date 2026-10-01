using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using TijarahJo.Domain.Models;
using TijarahJo.Application;
using TijarahJo.Application.Common;

namespace TijarahJo.Application.Abstractions.Services;

// ---------------------------------------------------------------------------
// DESIGN RULE: All service methods that perform I/O are async-only.
// Sync overloads were removed to prevent thread-pool starvation and deadlock
// risk under concurrent REST API load. Do not re-add sync methods here.
// ---------------------------------------------------------------------------


public interface ICategoryService
{
    Task<IReadOnlyList<CategoryModel>> GetAllCategoriesAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default);
    Task<Category?> FindAsync(int? categoryId, CancellationToken cancellationToken = default);
    Category Create(CategoryModel model);
    Task<bool> SaveAsync(Category category, CancellationToken cancellationToken = default);
    Task<bool> DeleteCategoryAsync(int? categoryId, CancellationToken cancellationToken = default);
    Task<bool> DoesCategoryExistAsync(int? categoryId, CancellationToken cancellationToken = default);
}

public interface IRoleService
{
    Task<IReadOnlyList<RoleModel>> GetAllRolesAsync(CancellationToken cancellationToken = default);
    Task<Role?> FindAsync(int? roleId, CancellationToken cancellationToken = default);
    Role Create(RoleModel model);
    Task<bool> SaveAsync(Role role, CancellationToken cancellationToken = default);
    Task<bool> DeleteRoleAsync(int? roleId, CancellationToken cancellationToken = default);
    Task<bool> DoesRoleExistAsync(int? roleId, CancellationToken cancellationToken = default);
    Task<bool> IsRoleNameTakenAsync(string roleName, int? excludeRoleId = null, CancellationToken cancellationToken = default);
}

public interface IPostService
{
    Task<Post?> FindAsync(int? postId, CancellationToken cancellationToken = default);
    Post Create(PostModel model);
    Task<bool> SaveAsync(Post post, CancellationToken cancellationToken = default);
    Task<bool> DeletePostAsync(int? postId, int actorUserId, CancellationToken cancellationToken = default);
    Task<bool> DoesPostExistAsync(int? postId, CancellationToken cancellationToken = default);
    Task<bool> IncrementViewsAsync(int? postId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PostModel>> GetPostsByUserIdAsync(int userId, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PostModel>> GetPostsByCategoryIdAsync(int categoryId, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default);
}

public enum PostStatusUpdateFailureReason
{
    InvalidRequest,
    InvalidStatus,
    PostNotFound,
    Forbidden,
    PersistenceFailed
}

public sealed class PostStatusUpdateResult
{
    public bool Success { get; init; }
    public Post? Post { get; init; }
    public PostStatusUpdateFailureReason? FailureReason { get; init; }
    public string? Message { get; init; }
}

public interface IPostStatusTransitionService
{
    Task<PostStatusUpdateResult> UpdateStatusAsync(
        int postId,
        int actorUserId,
        bool actorIsAdmin,
        string? requestedStatus,
        CancellationToken cancellationToken = default
    );
}

public enum PostImageCommandFailureReason
{
    InvalidRequest,
    PostNotFound,
    PostDeleted,
    PostImageNotFound,
    Forbidden,
    CrossPostMoveNotAllowed,
    PersistenceFailed
}

public sealed class PostImageCommandResult
{
    public bool Success { get; init; }
    public PostImage? PostImage { get; init; }
    public PostImageCommandFailureReason? FailureReason { get; init; }
    public string? Message { get; init; }
}

public interface IPostImageCommandService
{
    Task<PostImageCommandResult> CreateAsync(
        int actorUserId,
        bool actorIsAdmin,
        int postId,
        string? postImageUrl,
        DateTime? uploadedAt = null,
        CancellationToken cancellationToken = default
    );

    Task<PostImageCommandResult> UpdateAsync(
        int actorUserId,
        bool actorIsAdmin,
        int postImageId,
        int requestedPostId,
        string? postImageUrl,
        DateTime? uploadedAt = null,
        CancellationToken cancellationToken = default
    );

    Task<PostImageCommandResult> DeleteAsync(
        int actorUserId,
        bool actorIsAdmin,
        int postImageId,
        CancellationToken cancellationToken = default
    );
}

public interface IPostImageService
{
    Task<PostImage?> FindAsync(int? postImageId, CancellationToken cancellationToken = default);
    PostImage Create(PostImageModel model);
    Task<bool> SaveAsync(PostImage postImage, CancellationToken cancellationToken = default);
    Task<bool> DeletePostImageAsync(int? postImageId, CancellationToken cancellationToken = default);
    Task<bool> DoesPostImageExistAsync(int? postImageId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PostImageModel>> GetAllPostImagesAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PostImageModel>> GetPostImagesByPostIdAsync(int postId, CancellationToken cancellationToken = default);
}

public interface IFavoriteService
{
    Task<IReadOnlyList<FavoriteModel>> GetFavoritesByUserIdAsync(int userId, CancellationToken cancellationToken = default);
    Task<bool> AddFavoriteAsync(int userId, int postId, CancellationToken cancellationToken = default);
    Task<bool> RemoveFavoriteAsync(int userId, int postId, CancellationToken cancellationToken = default);
    Task<bool> IsFavoriteAsync(int userId, int postId, CancellationToken cancellationToken = default);
}

public enum FavoriteMutationFailureReason
{
    InvalidRequest,
    PostNotFound,
    NotFound,
    PersistenceFailed
}

public sealed class FavoriteMutationResult
{
    public bool Success { get; init; }
    public FavoriteMutationFailureReason? FailureReason { get; init; }
    public string? Message { get; init; }
}

public interface IFavoriteCommandService
{
    Task<FavoriteMutationResult> AddAsync(
        int userId,
        int postId,
        CancellationToken cancellationToken = default
    );

    Task<FavoriteMutationResult> RemoveAsync(
        int userId,
        int postId,
        CancellationToken cancellationToken = default
    );
}

public interface IMessageService
{
    Task<int?> GetOrCreateConversationIdAsync(int userA, int userB, int? postId = null, CancellationToken cancellationToken = default);
    Task<bool> CanAccessConversationAsync(int userId, int conversationId, CancellationToken cancellationToken = default);
    Task<ConversationAccessMetadata?> GetConversationMetadataAsync(int conversationId, CancellationToken cancellationToken = default);
    Task<List<MessageModel>> GetChatHistoryAsync(int conversationId, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default);
    Task<List<MessageModel>> GetChatHistoryBetweenUsersAsync(
        int userA,
        int userB,
        int pageNumber = 1,
        int pageSize = 50,
        CancellationToken cancellationToken = default)
        => Task.FromResult(new List<MessageModel>());
    Task<IReadOnlyList<int>> GetConversationIdsBetweenUsersAsync(
        int userA,
        int userB,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<int>>([]);
    Task<List<MessageModel>> GetRecentChatsAsync(int userId, CancellationToken cancellationToken = default);
    Task<bool> MarkAsReadAsync(int conversationId, int receiverId, CancellationToken cancellationToken = default);
    Task<bool> MarkAsReadBetweenUsersAsync(
        int currentUserId,
        int otherUserId,
        CancellationToken cancellationToken = default)
        => Task.FromResult(false);
    Message Create(MessageModel model);
    Task<bool> SaveAsync(Message message, CancellationToken cancellationToken = default);
}

public sealed class ConversationAccessMetadata
{
    public int User1Id { get; init; }
    public int User2Id { get; init; }
    public int? PostId { get; init; }
}

public interface IReviewService
{
    Task<IReadOnlyList<ReviewModel>> GetReviewsAsync(int userId, CancellationToken cancellationToken = default);
    Task<bool> CanReviewAsync(int reviewerId, int reviewedUserId, CancellationToken cancellationToken = default);
    Review Create(ReviewModel model);
    Task<bool> SaveAsync(Review review, CancellationToken cancellationToken = default);
    /// <summary>
    /// Returns aggregated rating stats (average, count) per user ID in a single DB round-trip.
    /// </summary>
    Task<IReadOnlyDictionary<int, (double AverageRating, int ReviewCount)>> GetRatingsByUserIdsAsync(IReadOnlyList<int> userIds, CancellationToken cancellationToken = default);
}

public enum ReviewSubmissionFailureReason
{
    InvalidRequest,
    SelfReviewForbidden,
    AlreadyReviewed,
    PersistenceFailed
}

public sealed class ReviewSubmissionResult
{
    public bool Success { get; init; }
    public Review? Review { get; init; }
    public ReviewSubmissionFailureReason? FailureReason { get; init; }
    public string? Message { get; init; }
}

public interface IReviewSubmissionService
{
    Task<ReviewSubmissionResult> SubmitAsync(
        int reviewerId,
        int reviewedUserId,
        int rating,
        string? comment,
        CancellationToken cancellationToken = default
    );
}

public enum PostReadFailureReason
{
    InvalidRequest,
    NotFound,
    PersistenceFailed
}

public sealed class PostReadResult
{
    public bool Success { get; init; }
    public Post? Post { get; init; }
    public PostReadFailureReason? FailureReason { get; init; }
    public string? Message { get; init; }
}

public sealed class PostReadCollectionResult
{
    public bool Success { get; init; }
    public IReadOnlyList<PostModel> Posts { get; init; } = [];
    public PostReadFailureReason? FailureReason { get; init; }
    public string? Message { get; init; }
}

public sealed class PostExistsResult
{
    public bool Success { get; init; }
    public bool Exists { get; init; }
    public PostReadFailureReason? FailureReason { get; init; }
    public string? Message { get; init; }
}

public sealed class PostViewIncrementResult
{
    public bool Success { get; init; }
    public PostReadFailureReason? FailureReason { get; init; }
    public string? Message { get; init; }
}

public interface IPostReadService
{
    Task<PostReadResult> GetByIdAsync(int postId, CancellationToken cancellationToken = default);
    Task<PostExistsResult> ExistsAsync(int postId, CancellationToken cancellationToken = default);
    Task<PostReadCollectionResult> GetByUserIdAsync(int userId, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default);
    Task<PostReadCollectionResult> GetByCategoryIdAsync(int categoryId, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default);
    Task<PostViewIncrementResult> IncrementViewsAsync(int postId, CancellationToken cancellationToken = default);
}

// ---------------------------------------------------------------------------
// Post Comments
// ---------------------------------------------------------------------------

public enum PostCommentFailureReason
{
    InvalidRequest,
    PostNotFound,
    CommentNotFound,
    Forbidden,
    RateLimited,
    PersistenceFailed
}

public sealed class PostCommentResult
{
    public bool Success { get; init; }
    public PostCommentModel? Comment { get; init; }
    public PostCommentFailureReason? FailureReason { get; init; }
    public string? Message { get; init; }
}

public sealed class PostCommentListResult
{
    public bool Success { get; init; }
    public IReadOnlyList<PostCommentModel> Comments { get; init; } = [];
    public int TotalCount { get; init; }
    public PostCommentFailureReason? FailureReason { get; init; }
    public string? Message { get; init; }
}

public interface IPostCommentService
{
    Task<PostCommentResult> AddCommentAsync(
        int postId, int userId, string? content, int? parentCommentId = null, CancellationToken cancellationToken = default);
    Task<PostCommentListResult> GetTopLevelCommentsAsync(
        int postId, int pageNumber = 1, int pageSize = 20, CancellationToken cancellationToken = default);
    Task<PostCommentListResult> GetRepliesAsync(
        int postId, int parentCommentId, int pageNumber = 1, int pageSize = 20, CancellationToken cancellationToken = default);
    Task<PostCommentResult> UpdateCommentAsync(
        int postId, int commentId, int actorUserId, string? content, CancellationToken cancellationToken = default);
    Task<PostCommentResult> DeleteCommentAsync(
        int postId, int commentId, int actorUserId, bool actorIsAdmin, int? postOwnerId = null, CancellationToken cancellationToken = default);
}
