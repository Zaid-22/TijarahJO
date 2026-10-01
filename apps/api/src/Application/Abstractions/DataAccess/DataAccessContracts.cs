using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using TijarahJo.Domain.Models;

namespace TijarahJo.Application.Abstractions.DataAccess;

// ---------------------------------------------------------------------------
// DESIGN RULE: All data access methods are async-only.
// Synchronous overloads were removed to prevent thread-pool starvation
// and deadlock risk under concurrent REST API load.
// ---------------------------------------------------------------------------

public interface ICategoryDataAccess
{
    Task<CategoryModel> GetCategoryByIDAsync(int? categoryId, CancellationToken cancellationToken = default);
    Task<int> AddCategoryAsync(CategoryModel category, CancellationToken cancellationToken = default);
    Task<bool> UpdateCategoryAsync(CategoryModel category, CancellationToken cancellationToken = default);
    Task<bool> DeleteCategoryAsync(int? categoryId, CancellationToken cancellationToken = default);
    Task<bool> DoesCategoryExistAsync(int? categoryId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CategoryModel>> GetAllCategoriesAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default);
}

public interface IFavoriteDataAccess
{
    Task<IReadOnlyList<FavoriteModel>> GetFavoritesByUserIdAsync(int userId, CancellationToken cancellationToken = default);
    Task<bool> AddFavoriteAsync(int userId, int postId, CancellationToken cancellationToken = default);
    Task<bool> RemoveFavoriteAsync(int userId, int postId, CancellationToken cancellationToken = default);
    Task<bool> IsFavoriteAsync(int userId, int postId, CancellationToken cancellationToken = default);
}

public interface IMessageDataAccess
{
    Task<int> AddMessageAsync(MessageModel message, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MessageModel>> GetChatHistoryAsync(int conversationId, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MessageModel>> GetChatHistoryBetweenUsersAsync(
        int userA,
        int userB,
        int pageNumber = 1,
        int pageSize = 50,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<MessageModel>>([]);
    Task<IReadOnlyList<int>> GetConversationIdsBetweenUsersAsync(
        int userA,
        int userB,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<int>>([]);
    Task<IReadOnlyList<MessageModel>> GetRecentChatsAsync(int userId, CancellationToken cancellationToken = default);
    Task<bool> MarkMessagesAsReadAsync(int conversationId, int receiverId, CancellationToken cancellationToken = default);
    Task<bool> MarkMessagesAsReadBetweenUsersAsync(
        int currentUserId,
        int otherUserId,
        CancellationToken cancellationToken = default)
        => Task.FromResult(false);
}

public sealed class ConversationMetadataModel
{
    public int User1Id { get; init; }
    public int User2Id { get; init; }
    public int? PostId { get; init; }
}

public interface IConversationDataAccess
{
    /// <summary>Finds an existing Conversation row for the User1/User2/Post triple. Returns null if none exists.</summary>
    Task<int?> FindConversationIdAsync(int user1Id, int user2Id, int? postId, CancellationToken cancellationToken = default);
    /// <summary>Inserts a new Conversation and returns the new ConversationID.</summary>
    Task<int?> CreateConversationAsync(int user1Id, int user2Id, int? postId, CancellationToken cancellationToken = default);
    /// <summary>Returns true when the given user participates in the conversation.</summary>
    Task<bool> IsUserInConversationAsync(int conversationId, int userId, CancellationToken cancellationToken = default);
    /// <summary>Returns participants and post context for a conversation if it exists; otherwise null.</summary>
    Task<ConversationMetadataModel?> GetConversationMetadataAsync(int conversationId, CancellationToken cancellationToken = default);
}

public interface IPostDataAccess
{
    Task<PostModel?> GetPostByIDAsync(int? postId, CancellationToken cancellationToken = default);
    Task<int> AddPostAsync(PostModel post, CancellationToken cancellationToken = default);
    Task<bool> UpdatePostAsync(PostModel post, CancellationToken cancellationToken = default);
    Task<bool> DeletePostAsync(int? postId, int actorUserId, CancellationToken cancellationToken = default);
    Task<bool> DoesPostExistAsync(int? postId, CancellationToken cancellationToken = default);
    Task<bool> IncrementPostViewsAsync(int? postId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PostModel>> GetPostsByUserIDAsync(int userId, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PostModel>> GetPostsByCategoryIDAsync(int categoryId, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default);
}

public interface IPostImageDataAccess
{
    Task<PostImageModel> GetPostImageByIDAsync(int? postImageId, CancellationToken cancellationToken = default);
    Task<int> AddPostImageAsync(PostImageModel postImage, CancellationToken cancellationToken = default);
    Task<bool> UpdatePostImageAsync(PostImageModel postImage, CancellationToken cancellationToken = default);
    Task<bool> DeletePostImageAsync(int? postImageId, CancellationToken cancellationToken = default);
    Task<bool> DoesPostImageExistAsync(int? postImageId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PostImageModel>> GetAllPostImagesAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PostImageModel>> GetPostImagesByPostIDAsync(int postId, CancellationToken cancellationToken = default);
}

public interface IReviewDataAccess
{
    Task<int> AddReviewAsync(ReviewModel review, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ReviewModel>> GetReviewsByUserIdAsync(int userId, CancellationToken cancellationToken = default);
    Task<bool> HasReviewedAsync(int reviewerId, int reviewedUserId, CancellationToken cancellationToken = default);
    /// <summary>
    /// Returns aggregated rating stats for each requested user ID in a single DB round-trip.
    /// Users with no reviews are omitted from the result.
    /// </summary>
    Task<IReadOnlyDictionary<int, (double AverageRating, int ReviewCount)>> GetRatingsByUserIdsAsync(IReadOnlyList<int> userIds, CancellationToken cancellationToken = default);
}

public interface IRoleDataAccess
{
    Task<RoleModel> GetRoleByIDAsync(int? roleId, CancellationToken cancellationToken = default);
    Task<int> AddRoleAsync(RoleModel role, CancellationToken cancellationToken = default);
    Task<bool> UpdateRoleAsync(RoleModel role, CancellationToken cancellationToken = default);
    Task<bool> DeleteRoleAsync(int? roleId, CancellationToken cancellationToken = default);
    Task<bool> DoesRoleExistAsync(int? roleId, CancellationToken cancellationToken = default);
    Task<bool> IsRoleNameTakenAsync(string roleName, int? excludeRoleId = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RoleModel>> GetAllRolesAsync(CancellationToken cancellationToken = default);
}

[Flags]
public enum UserUpdateFields
{
    None = 0,
    HashedPassword = 1 << 0,
    Email = 1 << 1,
    FirstName = 1 << 2,
    LastName = 1 << 3,
    Phone = 1 << 4,
    Location = 1 << 5,
    Bio = 1 << 6,
    Avatar = 1 << 7,
    Status = 1 << 8,
    Role = 1 << 9,
    IsDeleted = 1 << 10,
    TwoFactorEnabled = 1 << 11,
    TwoFactorSecret = 1 << 12,
    TwoFactorPendingSecret = 1 << 13,
    SuspendedUntil = 1 << 14,
    IsEmailVerified = 1 << 15
}

public interface IUserDataAccess
{
    // Returns null when userId is invalid or not found.
    Task<UserModel?> GetUserByIDAsync(int? userId, CancellationToken cancellationToken = default);
    Task<int> AddUserAsync(UserModel user, CancellationToken cancellationToken = default);
    Task<bool> UpdateUserFieldsAsync(
        UserModel user,
        int actorUserId,
        UserUpdateFields fields,
        CancellationToken cancellationToken = default);
    Task<bool> UpdatePasswordHashForCredentialRehashAsync(
        int userId,
        string expectedHashedPassword,
        string replacementHashedPassword,
        CancellationToken cancellationToken = default)
        => Task.FromResult(false);
    Task<bool> DeleteUserAsync(int? userId, int actorUserId, CancellationToken cancellationToken = default);
    Task<bool> DoesUserExistAsync(int? userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<UserModel>> GetAllUsersAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default);
    // Returns null when login is not found. Password verification must happen in the application layer (PasswordHelper), never in SQL.
    Task<UserModel?> GetUserByLoginAsync(string login, CancellationToken cancellationToken = default);
    // Combines email + phone lookup into a single DB query. Returns the first match.
    Task<UserModel?> GetUserByLoginCandidatesAsync(IReadOnlyList<string> candidates, CancellationToken cancellationToken = default);
}

public interface IVerificationChallengeDataAccess
{
    Task<string?> GetChallengeStateAsync(int userId, string challengeType, CancellationToken cancellationToken = default);
    Task UpsertChallengeStateAsync(int userId, string challengeType, string stateJson, DateTime expiresAt, CancellationToken cancellationToken = default);
    Task DeleteChallengeStateAsync(int userId, string challengeType, CancellationToken cancellationToken = default);

    async Task<bool> TryReplaceChallengeStateAsync(
        int userId,
        string challengeType,
        string? expectedStateJson,
        string stateJson,
        DateTime expiresAt,
        CancellationToken cancellationToken = default)
    {
        string? currentState = await GetChallengeStateAsync(userId, challengeType, cancellationToken);
        if (!string.Equals(currentState, expectedStateJson, StringComparison.Ordinal))
        {
            return false;
        }

        await UpsertChallengeStateAsync(userId, challengeType, stateJson, expiresAt, cancellationToken);
        return true;
    }

    async Task<bool> TryDeleteChallengeStateAsync(
        int userId,
        string challengeType,
        string expectedStateJson,
        CancellationToken cancellationToken = default)
    {
        string? currentState = await GetChallengeStateAsync(userId, challengeType, cancellationToken);
        if (!string.Equals(currentState, expectedStateJson, StringComparison.Ordinal))
        {
            return false;
        }

        await DeleteChallengeStateAsync(userId, challengeType, cancellationToken);
        return true;
    }
}

public interface IPostCommentDataAccess
{
    Task<int> AddCommentAsync(PostCommentModel comment, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PostCommentModel>> GetTopLevelCommentsByPostIdAsync(
        int postId, int pageNumber = 1, int pageSize = 20, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PostCommentModel>> GetRepliesByParentIdAsync(
        int parentCommentId, int pageNumber = 1, int pageSize = 20, CancellationToken cancellationToken = default);
    Task<PostCommentModel?> GetCommentByIdAsync(int commentId, CancellationToken cancellationToken = default);
    Task<bool> UpdateCommentAsync(int commentId, string content, CancellationToken cancellationToken = default);
    Task<bool> DeleteCommentAsync(int commentId, int actorUserId, CancellationToken cancellationToken = default);
    Task<int> GetRecentCommentCountAsync(int userId, TimeSpan window, CancellationToken cancellationToken = default);
    Task<int> GetCommentCountByPostIdAsync(int postId, CancellationToken cancellationToken = default);
}
