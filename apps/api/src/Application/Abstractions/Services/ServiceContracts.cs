using System.Collections.Generic;
using Models;
using TijarahJoDB.BLL;

namespace TijarahJoDB.Application.Abstractions.Services;

public interface IUserService
{
    IReadOnlyList<UserModel> GetAllUsers();
    UserAccount? Find(int? userId);
    UserAccount? FindByLogin(string login);
    UserAccount Create(UserModel model);
    bool Save(UserAccount user);
    bool DeleteUser(int? userId);
    bool DoesUserExist(int? userId);
}

public interface ICategoryService
{
    IReadOnlyList<CategoryModel> GetAllCategories();
    Category? Find(int? categoryId);
    Category Create(CategoryModel model);
    bool Save(Category category);
    bool DeleteCategory(int? categoryId);
    bool DoesCategoryExist(int? categoryId);
}

public interface IRoleService
{
    IReadOnlyList<RoleModel> GetAllRoles();
    Role? Find(int? roleId);
    Role Create(RoleModel model);
    bool Save(Role role);
    bool DeleteRole(int? roleId);
    bool DoesRoleExist(int? roleId);
}

public interface IPostService
{
    Post? Find(int? postId);
    Post Create(PostModel model);
    bool Save(Post post);
    bool DeletePost(int? postId);
    bool DoesPostExist(int? postId);
    bool IncrementViews(int? postId);
    IReadOnlyList<PostModel> GetPostsByUserId(int userId);
    IReadOnlyList<PostModel> GetPostsByCategoryId(int categoryId);
}

public interface IPostImageService
{
    PostImage? Find(int? postImageId);
    PostImage Create(PostImageModel model);
    bool Save(PostImage postImage);
    bool DeletePostImage(int? postImageId);
    bool DoesPostImageExist(int? postImageId);
    IReadOnlyList<PostImageModel> GetAllPostImages();
    IReadOnlyList<PostImageModel> GetPostImagesByPostId(int postId);
}

public interface IFavoriteService
{
    List<FavoriteModel> GetFavoritesByUserId(int userId);
    bool AddFavorite(int userId, int postId);
    bool RemoveFavorite(int userId, int postId);
    bool IsFavorite(int userId, int postId);
}

public interface IMessageService
{
    List<MessageModel> GetChatHistory(int userId1, int userId2);
    List<MessageModel> GetRecentChats(int userId);
    bool MarkAsRead(int receiverId, int senderId);
    Message Create(MessageModel model);
    bool Save(Message message);
}

public interface IReviewService
{
    List<ReviewModel> GetReviews(int userId);
    bool CanReview(int reviewerId, int reviewedUserId);
    Review Create(ReviewModel model);
    bool Save(Review review);
}
