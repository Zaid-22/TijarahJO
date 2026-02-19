using System;
using System.Collections.Generic;
using Models;

namespace TijarahJoDB.Application.Abstractions.DataAccess;

public interface ICategoryDataAccess
{
    CategoryModel GetCategoryByID(int? categoryId);
    int AddCategory(CategoryModel category);
    bool UpdateCategory(CategoryModel category);
    bool DeleteCategory(int? categoryId);
    bool DoesCategoryExist(int? categoryId);
    IReadOnlyList<CategoryModel> GetAllCategories();
}

public interface IFavoriteDataAccess
{
    List<FavoriteModel> GetFavoritesByUserId(int userId);
    bool AddFavorite(int userId, int postId);
    bool RemoveFavorite(int userId, int postId);
    bool IsFavorite(int userId, int postId);
}

public interface IMessageDataAccess
{
    int AddMessage(MessageModel message);
    IReadOnlyList<MessageModel> GetChatHistory(int userId1, int userId2);
    IReadOnlyList<MessageModel> GetRecentChats(int userId);
    bool MarkMessagesAsRead(int receiverId, int senderId);
}

public interface IPostDataAccess
{
    PostModel GetPostByID(int? postId);
    int AddPost(PostModel post);
    bool UpdatePost(PostModel post);
    bool DeletePost(int? postId);
    bool DoesPostExist(int? postId);
    bool IncrementPostViews(int? postId);
    IReadOnlyList<PostModel> GetPostsByUserID(int userId);
    IReadOnlyList<PostModel> GetPostsByCategoryID(int categoryId);
}

public interface IPostImageDataAccess
{
    PostImageModel GetPostImageByID(int? postImageId);
    int AddPostImage(PostImageModel postImage);
    bool UpdatePostImage(PostImageModel postImage);
    bool DeletePostImage(int? postImageId);
    bool DoesPostImageExist(int? postImageId);
    IReadOnlyList<PostImageModel> GetAllPostImages();
    IReadOnlyList<PostImageModel> GetPostImagesByPostID(int postId);
}

public interface IReviewDataAccess
{
    int AddReview(ReviewModel review);
    IReadOnlyList<ReviewModel> GetReviewsByUserId(int userId);
    bool HasReviewed(int reviewerId, int reviewedUserId);
}

public interface IRoleDataAccess
{
    RoleModel GetRoleByID(int? roleId);
    int AddRole(RoleModel role);
    bool UpdateRole(RoleModel role);
    bool DeleteRole(int? roleId);
    bool DoesRoleExist(int? roleId);
    IReadOnlyList<RoleModel> GetAllRoles();
}

public interface IUserDataAccess
{
    UserModel GetUserByID(int? userId);
    int AddUser(UserModel user);
    bool UpdateUser(UserModel user);
    bool DeleteUser(int? userId);
    bool DoesUserExist(int? userId);
    IReadOnlyList<UserModel> GetAllUsers();
    UserModel GetUserByLoginAndPassword(string login, string hashedPassword);
    UserModel GetUserByLogin(string login);
}
