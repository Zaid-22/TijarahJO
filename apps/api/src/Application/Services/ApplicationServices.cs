using System;
using System.Collections.Generic;
using Models;
using TijarahJoDB.Application.Abstractions.DataAccess;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.BLL;

namespace TijarahJoDB.Application.Services;

public sealed class UserService : IUserService
{
    private readonly IUserDataAccess _users;

    public UserService(IUserDataAccess users)
    {
        _users = users;
    }

    public IReadOnlyList<UserModel> GetAllUsers() => _users.GetAllUsers();

    public UserAccount? Find(int? userId)
    {
        UserModel userModel = _users.GetUserByID(userId);
        return userModel == null ? null : new UserAccount(userModel, UserAccount.ModeType.Update);
    }

    public UserAccount? FindByLogin(string login)
    {
        UserModel userModel = _users.GetUserByLogin(login);
        return userModel == null ? null : new UserAccount(userModel, UserAccount.ModeType.Update);
    }

    public UserAccount Create(UserModel model) => new(model);

    public bool Save(UserAccount user)
    {
        if (user.Mode == UserAccount.ModeType.AddNew)
        {
            int userId = _users.AddUser(user.UserModel);
            if (userId <= 0)
            {
                return false;
            }

            user.UserID = userId;
            user.Mode = UserAccount.ModeType.Update;
            return true;
        }

        return _users.UpdateUser(user.UserModel);
    }

    public bool DeleteUser(int? userId) => _users.DeleteUser(userId);

    public bool DoesUserExist(int? userId) => _users.DoesUserExist(userId);
}

public sealed class CategoryService : ICategoryService
{
    private readonly ICategoryDataAccess _categories;

    public CategoryService(ICategoryDataAccess categories)
    {
        _categories = categories;
    }

    public IReadOnlyList<CategoryModel> GetAllCategories() => _categories.GetAllCategories();

    public Category? Find(int? categoryId)
    {
        CategoryModel categoryModel = _categories.GetCategoryByID(categoryId);
        return categoryModel == null
            ? null
            : new Category(categoryModel, Category.ModeType.Update);
    }

    public Category Create(CategoryModel model) => new(model);

    public bool Save(Category category)
    {
        if (category.Mode == Category.ModeType.AddNew)
        {
            int categoryId = _categories.AddCategory(category.CategoryModel);
            if (categoryId <= 0)
            {
                return false;
            }

            category.CategoryID = categoryId;
            category.Mode = Category.ModeType.Update;
            return true;
        }

        return _categories.UpdateCategory(category.CategoryModel);
    }

    public bool DeleteCategory(int? categoryId) => _categories.DeleteCategory(categoryId);

    public bool DoesCategoryExist(int? categoryId) => _categories.DoesCategoryExist(categoryId);
}

public sealed class RoleService : IRoleService
{
    private readonly IRoleDataAccess _roles;

    public RoleService(IRoleDataAccess roles)
    {
        _roles = roles;
    }

    public IReadOnlyList<RoleModel> GetAllRoles() => _roles.GetAllRoles();

    public Role? Find(int? roleId)
    {
        RoleModel roleModel = _roles.GetRoleByID(roleId);
        return roleModel == null ? null : new Role(roleModel, Role.ModeType.Update);
    }

    public Role Create(RoleModel model) => new(model);

    public bool Save(Role role)
    {
        if (role.Mode == Role.ModeType.AddNew)
        {
            int roleId = _roles.AddRole(role.RoleModel);
            if (roleId <= 0)
            {
                return false;
            }

            role.RoleID = roleId;
            role.Mode = Role.ModeType.Update;
            return true;
        }

        return _roles.UpdateRole(role.RoleModel);
    }

    public bool DeleteRole(int? roleId) => _roles.DeleteRole(roleId);

    public bool DoesRoleExist(int? roleId) => _roles.DoesRoleExist(roleId);
}

public sealed class PostService : IPostService
{
    private readonly IPostDataAccess _posts;

    public PostService(IPostDataAccess posts)
    {
        _posts = posts;
    }

    public Post? Find(int? postId)
    {
        PostModel postModel = _posts.GetPostByID(postId);
        return postModel == null ? null : new Post(postModel, Post.ModeType.Update);
    }

    public Post Create(PostModel model) => new(model);

    public bool Save(Post post)
    {
        if (post.Mode == Post.ModeType.AddNew)
        {
            int postId = _posts.AddPost(post.PostModel);
            if (postId <= 0)
            {
                return false;
            }

            post.PostID = postId;
            post.Mode = Post.ModeType.Update;
            return true;
        }

        return _posts.UpdatePost(post.PostModel);
    }

    public bool DeletePost(int? postId) => _posts.DeletePost(postId);

    public bool DoesPostExist(int? postId) => _posts.DoesPostExist(postId);

    public bool IncrementViews(int? postId) => _posts.IncrementPostViews(postId);

    public IReadOnlyList<PostModel> GetPostsByUserId(int userId) => _posts.GetPostsByUserID(userId);

    public IReadOnlyList<PostModel> GetPostsByCategoryId(int categoryId) => _posts.GetPostsByCategoryID(categoryId);
}

public sealed class PostImageService : IPostImageService
{
    private readonly IPostImageDataAccess _postImages;

    public PostImageService(IPostImageDataAccess postImages)
    {
        _postImages = postImages;
    }

    public PostImage? Find(int? postImageId)
    {
        PostImageModel postImageModel = _postImages.GetPostImageByID(postImageId);
        return postImageModel == null
            ? null
            : new PostImage(postImageModel, PostImage.ModeType.Update);
    }

    public PostImage Create(PostImageModel model) => new(model);

    public bool Save(PostImage postImage)
    {
        if (postImage.Mode == PostImage.ModeType.AddNew)
        {
            int postImageId = _postImages.AddPostImage(postImage.PostImageModel);
            if (postImageId <= 0)
            {
                return false;
            }

            postImage.PostImageID = postImageId;
            postImage.Mode = PostImage.ModeType.Update;
            return true;
        }

        return _postImages.UpdatePostImage(postImage.PostImageModel);
    }

    public bool DeletePostImage(int? postImageId) => _postImages.DeletePostImage(postImageId);

    public bool DoesPostImageExist(int? postImageId) => _postImages.DoesPostImageExist(postImageId);

    public IReadOnlyList<PostImageModel> GetAllPostImages() => _postImages.GetAllPostImages();

    public IReadOnlyList<PostImageModel> GetPostImagesByPostId(int postId) => _postImages.GetPostImagesByPostID(postId);
}

public sealed class FavoriteService : IFavoriteService
{
    private readonly IFavoriteDataAccess _favorites;

    public FavoriteService(IFavoriteDataAccess favorites)
    {
        _favorites = favorites;
    }

    public List<FavoriteModel> GetFavoritesByUserId(int userId) => _favorites.GetFavoritesByUserId(userId);

    public bool AddFavorite(int userId, int postId) => _favorites.AddFavorite(userId, postId);

    public bool RemoveFavorite(int userId, int postId) => _favorites.RemoveFavorite(userId, postId);

    public bool IsFavorite(int userId, int postId) => _favorites.IsFavorite(userId, postId);
}

public sealed class MessageService : IMessageService
{
    private readonly IMessageDataAccess _messages;

    public MessageService(IMessageDataAccess messages)
    {
        _messages = messages;
    }

    public List<MessageModel> GetChatHistory(int userId1, int userId2) =>
        new(_messages.GetChatHistory(userId1, userId2));

    public List<MessageModel> GetRecentChats(int userId) =>
        new(_messages.GetRecentChats(userId));

    public bool MarkAsRead(int receiverId, int senderId) =>
        _messages.MarkMessagesAsRead(receiverId, senderId);

    public Message Create(MessageModel model) => new(model);

    public bool Save(Message message)
    {
        int messageId = _messages.AddMessage(message.MessageModel);
        if (messageId <= 0)
        {
            return false;
        }

        message.MessageModel.MessageId = messageId;
        return true;
    }
}

public sealed class ReviewService : IReviewService
{
    private readonly IReviewDataAccess _reviews;

    public ReviewService(IReviewDataAccess reviews)
    {
        _reviews = reviews;
    }

    public List<ReviewModel> GetReviews(int userId)
    {
        return new List<ReviewModel>(_reviews.GetReviewsByUserId(userId));
    }

    public bool CanReview(int reviewerId, int reviewedUserId)
    {
        if (reviewerId == reviewedUserId)
        {
            return false;
        }

        return !_reviews.HasReviewed(reviewerId, reviewedUserId);
    }

    public Review Create(ReviewModel model) => new(model);

    public bool Save(Review review)
    {
        int reviewId = _reviews.AddReview(review.ReviewModel);
        if (reviewId <= 0)
        {
            return false;
        }

        review.ReviewModel.ReviewID = reviewId;
        return true;
    }
}
