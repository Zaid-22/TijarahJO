using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Models;

namespace TijarahJoDB.Application.Abstractions.DataAccess;

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
    Task<IReadOnlyList<MessageModel>> GetChatHistoryAsync(int conversationId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MessageModel>> GetRecentChatsAsync(int userId, CancellationToken cancellationToken = default);
    Task<bool> MarkMessagesAsReadAsync(int conversationId, int receiverId, CancellationToken cancellationToken = default);
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
    Task<PostModel> GetPostByIDAsync(int? postId, CancellationToken cancellationToken = default);
    Task<int> AddPostAsync(PostModel post, CancellationToken cancellationToken = default);
    Task<bool> UpdatePostAsync(PostModel post, CancellationToken cancellationToken = default);
    Task<bool> DeletePostAsync(int? postId, CancellationToken cancellationToken = default);
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
}

public interface IRoleDataAccess
{
    Task<RoleModel> GetRoleByIDAsync(int? roleId, CancellationToken cancellationToken = default);
    Task<int> AddRoleAsync(RoleModel role, CancellationToken cancellationToken = default);
    Task<bool> UpdateRoleAsync(RoleModel role, CancellationToken cancellationToken = default);
    Task<bool> DeleteRoleAsync(int? roleId, CancellationToken cancellationToken = default);
    Task<bool> DoesRoleExistAsync(int? roleId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RoleModel>> GetAllRolesAsync(CancellationToken cancellationToken = default);
}

public interface IUserDataAccess
{
    // Returns null when userId is invalid or not found.
    Task<UserModel?> GetUserByIDAsync(int? userId, CancellationToken cancellationToken = default);
    Task<int> AddUserAsync(UserModel user, CancellationToken cancellationToken = default);
    Task<bool> UpdateUserAsync(UserModel user, int actorUserId, CancellationToken cancellationToken = default);
    Task<bool> DeleteUserAsync(int? userId, int actorUserId, CancellationToken cancellationToken = default);
    Task<bool> DoesUserExistAsync(int? userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<UserModel>> GetAllUsersAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default);
    // Returns null when login is not found. Password verification must happen in the application layer (PasswordHelper), never in SQL.
    Task<UserModel?> GetUserByLoginAsync(string login, CancellationToken cancellationToken = default);
}
