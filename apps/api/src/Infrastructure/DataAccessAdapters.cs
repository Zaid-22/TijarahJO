using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using Models;
using TijarahJoDB.Application.Abstractions.DataAccess;
using TijarahJoDB.Application.Common;
using TijarahJoDB.DAL.Persistence;

namespace TijarahJoDB.DAL;

public sealed class CategoryDataAccessAdapter : ICategoryDataAccess
{
    private readonly TijarahJoDbContext _dbContext;

    public CategoryDataAccessAdapter(TijarahJoDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public CategoryModel GetCategoryByID(int? categoryId)
    {
        if (!categoryId.HasValue || categoryId.Value < 1)
        {
            return null!;
        }

        CategoryEntity? entity = _dbContext.Categories
            .AsNoTracking()
            .FirstOrDefault(item => item.CategoryID == categoryId.Value);
        return entity is null ? null! : ToModel(entity);
    }

    public int AddCategory(CategoryModel category)
    {
        var entity = new CategoryEntity
        {
            CategoryName = category.CategoryName,
            NameAr = category.NameAr,
            Icon = category.Icon,
            Color = category.Color,
            Image = category.Image,
            CreatedAt = category.CreatedAt == default ? DateTime.UtcNow : category.CreatedAt,
            IsDeleted = category.IsDeleted
        };

        _dbContext.Categories.Add(entity);
        _dbContext.SaveChanges();
        return entity.CategoryID;
    }

    public bool UpdateCategory(CategoryModel category)
    {
        if (!category.CategoryID.HasValue || category.CategoryID.Value < 1)
        {
            return false;
        }

        CategoryEntity? entity = _dbContext.Categories
            .FirstOrDefault(item => item.CategoryID == category.CategoryID.Value);
        if (entity is null)
        {
            return false;
        }

        entity.CategoryName = category.CategoryName;
        entity.NameAr = category.NameAr;
        entity.Icon = category.Icon;
        entity.Color = category.Color;
        entity.Image = category.Image;
        entity.CreatedAt = category.CreatedAt == default ? entity.CreatedAt : category.CreatedAt;
        entity.IsDeleted = category.IsDeleted;

        return _dbContext.SaveChanges() > 0;
    }

    public bool DeleteCategory(int? categoryId)
    {
        if (!categoryId.HasValue || categoryId.Value < 1)
        {
            return false;
        }

        CategoryEntity? entity = _dbContext.Categories
            .FirstOrDefault(item => item.CategoryID == categoryId.Value);
        if (entity is null)
        {
            return false;
        }

        if (entity.IsDeleted)
        {
            return false;
        }

        entity.IsDeleted = true;
        return _dbContext.SaveChanges() > 0;
    }

    public bool DoesCategoryExist(int? categoryId)
    {
        return categoryId.HasValue
               && categoryId.Value > 0
               && _dbContext.Categories.AsNoTracking().Any(item => item.CategoryID == categoryId.Value);
    }

    public IReadOnlyList<CategoryModel> GetAllCategories()
    {
        return _dbContext.Categories
            .AsNoTracking()
            .Where(item => !item.IsDeleted)
            .OrderBy(item => item.CategoryID)
            .Select(ToModel)
            .ToList();
    }

    private static CategoryModel ToModel(CategoryEntity entity)
    {
        return new CategoryModel(
            entity.CategoryID,
            entity.CategoryName,
            entity.CreatedAt,
            entity.IsDeleted,
            entity.NameAr,
            entity.Icon,
            entity.Color,
            entity.Image
        );
    }
}

public sealed class FavoriteDataAccessAdapter : IFavoriteDataAccess
{
    private readonly TijarahJoDbContext _dbContext;

    public FavoriteDataAccessAdapter(TijarahJoDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public List<FavoriteModel> GetFavoritesByUserId(int userId)
    {
        return _dbContext.Favorites
            .AsNoTracking()
            .Where(item => item.UserID == userId && !item.IsDeleted)
            .OrderByDescending(item => item.CreatedAt)
            .ThenByDescending(item => item.FavoriteID)
            .Select(item => new FavoriteModel(
                item.FavoriteID,
                item.UserID,
                item.PostID,
                item.CreatedAt
            ))
            .ToList();
    }

    public bool AddFavorite(int userId, int postId)
    {
        if (userId < 1 || postId < 1)
        {
            return false;
        }

        FavoriteEntity? existing = _dbContext.Favorites
            .FirstOrDefault(item => item.UserID == userId && item.PostID == postId);
        if (existing is not null)
        {
            if (existing.IsDeleted)
            {
                existing.IsDeleted = false;
                existing.CreatedAt = DateTime.UtcNow;
                return _dbContext.SaveChanges() > 0;
            }

            return true;
        }

        _dbContext.Favorites.Add(new FavoriteEntity
        {
            UserID = userId,
            PostID = postId,
            CreatedAt = DateTime.UtcNow,
            IsDeleted = false
        });

        try
        {
            _dbContext.SaveChanges();
            return true;
        }
        catch (DbUpdateException)
        {
            return _dbContext.Favorites
                .AsNoTracking()
                .Any(item => item.UserID == userId && item.PostID == postId && !item.IsDeleted);
        }
    }

    public bool RemoveFavorite(int userId, int postId)
    {
        FavoriteEntity? entity = _dbContext.Favorites
            .FirstOrDefault(item => item.UserID == userId && item.PostID == postId && !item.IsDeleted);
        if (entity is null)
        {
            return false;
        }

        entity.IsDeleted = true;
        return _dbContext.SaveChanges() > 0;
    }

    public bool IsFavorite(int userId, int postId)
    {
        return _dbContext.Favorites
            .AsNoTracking()
            .Any(item => item.UserID == userId && item.PostID == postId && !item.IsDeleted);
    }
}

public sealed class MessageDataAccessAdapter : IMessageDataAccess
{
    private readonly TijarahJoDbContext _dbContext;

    public MessageDataAccessAdapter(TijarahJoDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public int AddMessage(MessageModel message)
    {
        var entity = new MessageEntity
        {
            SenderID = message.SenderId,
            ReceiverID = message.ReceiverId,
            PostID = message.PostId,
            Content = message.Content,
            Timestamp = message.Timestamp == default ? DateTime.UtcNow : message.Timestamp,
            IsRead = message.IsRead
        };

        _dbContext.Messages.Add(entity);
        _dbContext.SaveChanges();
        return entity.MessageID;
    }

    public IReadOnlyList<MessageModel> GetChatHistory(int userId1, int userId2)
    {
        return _dbContext.Messages
            .AsNoTracking()
            .Where(item =>
                (item.SenderID == userId1 && item.ReceiverID == userId2) ||
                (item.SenderID == userId2 && item.ReceiverID == userId1))
            .OrderBy(item => item.Timestamp)
            .ThenBy(item => item.MessageID)
            .Select(ToModel)
            .ToList();
    }

    public IReadOnlyList<MessageModel> GetRecentChats(int userId)
    {
        const string sql = @"
WITH Ranked AS
(
    SELECT
        m.MessageID,
        m.SenderID,
        m.ReceiverID,
        m.PostID,
        m.Content,
        m.[Timestamp],
        m.IsRead,
        ROW_NUMBER() OVER
        (
            PARTITION BY CASE WHEN m.SenderID = @UserID THEN m.ReceiverID ELSE m.SenderID END
            ORDER BY m.[Timestamp] DESC, m.MessageID DESC
        ) AS RowNum
    FROM dbo.TbMessages AS m
    WHERE m.SenderID = @UserID OR m.ReceiverID = @UserID
)
SELECT
    MessageID,
    SenderID,
    ReceiverID,
    PostID,
    Content,
    [Timestamp],
    IsRead
FROM Ranked
WHERE RowNum = 1
ORDER BY [Timestamp] DESC, MessageID DESC;";

        var userIdParameter = new SqlParameter("@UserID", userId);

        List<MessageEntity> recent = _dbContext.Messages
            .FromSqlRaw(sql, userIdParameter)
            .AsNoTracking()
            .ToList();

        return recent.Select(ToModel).ToList();
    }

    public bool MarkMessagesAsRead(int receiverId, int senderId)
    {
        int updatedRows = _dbContext.Messages
            .Where(item => item.ReceiverID == receiverId && item.SenderID == senderId && !item.IsRead)
            .ExecuteUpdate(setters => setters.SetProperty(item => item.IsRead, true));
        return updatedRows > 0;
    }

    private static MessageModel ToModel(MessageEntity entity)
    {
        return new MessageModel(
            entity.MessageID,
            entity.SenderID,
            entity.ReceiverID,
            entity.PostID,
            entity.Content,
            entity.Timestamp,
            entity.IsRead
        );
    }
}

public sealed class PostDataAccessAdapter : IPostDataAccess
{
    private readonly TijarahJoDbContext _dbContext;

    public PostDataAccessAdapter(TijarahJoDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public PostModel GetPostByID(int? postId)
    {
        if (!postId.HasValue || postId.Value < 1)
        {
            return null!;
        }

        PostEntity? entity = _dbContext.Posts
            .AsNoTracking()
            .FirstOrDefault(item => item.PostID == postId.Value);
        return entity is null ? null! : ToModel(entity);
    }

    public int AddPost(PostModel post)
    {
        var entity = new PostEntity
        {
            UserID = post.UserID,
            CategoryID = post.CategoryID,
            PostTitle = post.PostTitle,
            PostDescription = post.PostDescription,
            Price = post.Price,
            Status = post.Status,
            CreatedAt = post.CreatedAt == default ? DateTime.UtcNow : post.CreatedAt,
            IsDeleted = post.IsDeleted,
            Views = Math.Max(post.Views, 0),
            City = post.City,
            Area = post.Area
        };

        _dbContext.Posts.Add(entity);
        _dbContext.SaveChanges();
        return entity.PostID;
    }

    public bool UpdatePost(PostModel post)
    {
        if (!post.PostID.HasValue || post.PostID.Value < 1)
        {
            return false;
        }

        PostEntity? entity = _dbContext.Posts
            .FirstOrDefault(item => item.PostID == post.PostID.Value);
        if (entity is null)
        {
            return false;
        }

        entity.UserID = post.UserID;
        entity.CategoryID = post.CategoryID;
        entity.PostTitle = post.PostTitle;
        entity.PostDescription = post.PostDescription;
        entity.Price = post.Price;
        entity.Status = post.Status;
        entity.CreatedAt = post.CreatedAt == default ? entity.CreatedAt : post.CreatedAt;
        entity.IsDeleted = post.IsDeleted;
        entity.City = post.City;
        entity.Area = post.Area;

        return _dbContext.SaveChanges() > 0;
    }

    public bool DeletePost(int? postId)
    {
        if (!postId.HasValue || postId.Value < 1)
        {
            return false;
        }

        PostEntity? post = _dbContext.Posts.FirstOrDefault(item => item.PostID == postId.Value);
        if (post is null)
        {
            return false;
        }

        if (post.IsDeleted)
        {
            return false;
        }

        using var transaction = _dbContext.Database.BeginTransaction();
        try
        {
            post.IsDeleted = true;

            _dbContext.PostImages
                .Where(item => item.PostID == postId.Value && !item.IsDeleted)
                .ExecuteUpdate(setters => setters.SetProperty(item => item.IsDeleted, true));

            _dbContext.Favorites
                .Where(item => item.PostID == postId.Value && !item.IsDeleted)
                .ExecuteUpdate(setters => setters.SetProperty(item => item.IsDeleted, true));

            bool deleted = _dbContext.SaveChanges() > 0;
            if (!deleted)
            {
                transaction.Rollback();
                return false;
            }

            transaction.Commit();
            return true;
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public bool DoesPostExist(int? postId)
    {
        return postId.HasValue
               && postId.Value > 0
               && _dbContext.Posts.AsNoTracking().Any(item => item.PostID == postId.Value);
    }

    public bool IncrementPostViews(int? postId)
    {
        if (!postId.HasValue || postId.Value < 1)
        {
            return false;
        }

        PostEntity? entity = _dbContext.Posts
            .FirstOrDefault(item => item.PostID == postId.Value && !item.IsDeleted);
        if (entity is null)
        {
            return false;
        }

        entity.Views += 1;
        return _dbContext.SaveChanges() > 0;
    }

    public IReadOnlyList<PostModel> GetPostsByUserID(int userId)
    {
        return _dbContext.Posts
            .AsNoTracking()
            .Where(item => item.UserID == userId && !item.IsDeleted)
            .OrderByDescending(item => item.CreatedAt)
            .ThenByDescending(item => item.PostID)
            .Select(ToModel)
            .ToList();
    }

    public IReadOnlyList<PostModel> GetPostsByCategoryID(int categoryId)
    {
        return _dbContext.Posts
            .AsNoTracking()
            .Where(item => item.CategoryID == categoryId && !item.IsDeleted)
            .OrderByDescending(item => item.CreatedAt)
            .ThenByDescending(item => item.PostID)
            .Select(ToModel)
            .ToList();
    }

    private static PostModel ToModel(PostEntity entity)
    {
        return new PostModel(
            entity.PostID,
            entity.UserID,
            entity.CategoryID,
            entity.PostTitle,
            entity.PostDescription ?? string.Empty,
            entity.Price,
            entity.Status,
            entity.CreatedAt,
            entity.IsDeleted,
            entity.Views,
            entity.City,
            entity.Area
        );
    }
}

public sealed class PostImageDataAccessAdapter : IPostImageDataAccess
{
    private readonly TijarahJoDbContext _dbContext;

    public PostImageDataAccessAdapter(TijarahJoDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public PostImageModel GetPostImageByID(int? postImageId)
    {
        if (!postImageId.HasValue || postImageId.Value < 1)
        {
            return null!;
        }

        PostImageEntity? entity = _dbContext.PostImages
            .AsNoTracking()
            .FirstOrDefault(item => item.PostImageID == postImageId.Value);
        return entity is null ? null! : ToModel(entity);
    }

    public int AddPostImage(PostImageModel postImage)
    {
        var entity = new PostImageEntity
        {
            PostID = postImage.PostID,
            PostImageURL = postImage.PostImageURL,
            UploadedAt = postImage.UploadedAt == default ? DateTime.UtcNow : postImage.UploadedAt,
            IsDeleted = postImage.IsDeleted
        };

        _dbContext.PostImages.Add(entity);
        _dbContext.SaveChanges();
        return entity.PostImageID;
    }

    public bool UpdatePostImage(PostImageModel postImage)
    {
        if (!postImage.PostImageID.HasValue || postImage.PostImageID.Value < 1)
        {
            return false;
        }

        PostImageEntity? entity = _dbContext.PostImages
            .FirstOrDefault(item => item.PostImageID == postImage.PostImageID.Value);
        if (entity is null)
        {
            return false;
        }

        entity.PostID = postImage.PostID;
        entity.PostImageURL = postImage.PostImageURL;
        entity.UploadedAt = postImage.UploadedAt == default ? entity.UploadedAt : postImage.UploadedAt;
        entity.IsDeleted = postImage.IsDeleted;

        return _dbContext.SaveChanges() > 0;
    }

    public bool DeletePostImage(int? postImageId)
    {
        if (!postImageId.HasValue || postImageId.Value < 1)
        {
            return false;
        }

        PostImageEntity? entity = _dbContext.PostImages
            .FirstOrDefault(item => item.PostImageID == postImageId.Value);
        if (entity is null)
        {
            return false;
        }

        if (entity.IsDeleted)
        {
            return false;
        }

        entity.IsDeleted = true;
        return _dbContext.SaveChanges() > 0;
    }

    public bool DoesPostImageExist(int? postImageId)
    {
        return postImageId.HasValue
               && postImageId.Value > 0
               && _dbContext.PostImages.AsNoTracking().Any(item => item.PostImageID == postImageId.Value);
    }

    public IReadOnlyList<PostImageModel> GetAllPostImages()
    {
        return _dbContext.PostImages
            .AsNoTracking()
            .Where(item => !item.IsDeleted)
            .OrderBy(item => item.UploadedAt)
            .ThenBy(item => item.PostImageID)
            .Select(ToModel)
            .ToList();
    }

    public IReadOnlyList<PostImageModel> GetPostImagesByPostID(int postId)
    {
        return _dbContext.PostImages
            .AsNoTracking()
            .Where(item => item.PostID == postId && !item.IsDeleted)
            .OrderBy(item => item.UploadedAt)
            .ThenBy(item => item.PostImageID)
            .Select(ToModel)
            .ToList();
    }

    private static PostImageModel ToModel(PostImageEntity entity)
    {
        return new PostImageModel(
            entity.PostImageID,
            entity.PostID,
            entity.PostImageURL,
            entity.UploadedAt,
            entity.IsDeleted
        );
    }
}

public sealed class ReviewDataAccessAdapter : IReviewDataAccess
{
    private readonly TijarahJoDbContext _dbContext;

    public ReviewDataAccessAdapter(TijarahJoDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public int AddReview(ReviewModel review)
    {
        var entity = new ReviewEntity
        {
            ReviewerID = review.ReviewerID,
            ReviewedUserID = review.ReviewedUserID,
            Rating = review.Rating,
            Comment = review.Comment,
            Timestamp = review.Timestamp == default ? DateTime.UtcNow : review.Timestamp
        };

        _dbContext.Reviews.Add(entity);
        _dbContext.SaveChanges();
        return entity.ReviewID;
    }

    public IReadOnlyList<ReviewModel> GetReviewsByUserId(int userId)
    {
        List<ReviewEntity> reviews = _dbContext.Reviews
            .AsNoTracking()
            .Where(item => item.ReviewedUserID == userId)
            .OrderByDescending(item => item.Timestamp)
            .ThenByDescending(item => item.ReviewID)
            .ToList();

        HashSet<int> reviewerIds = reviews
            .Select(item => item.ReviewerID)
            .ToHashSet();

        Dictionary<int, (string FirstName, string? LastName, string? Avatar)> reviewers = _dbContext.Users
            .AsNoTracking()
            .Where(item => reviewerIds.Contains(item.UserID))
            .Select(item => new { item.UserID, item.FirstName, item.LastName, item.Avatar })
            .ToDictionary(
                item => item.UserID,
                item => (item.FirstName, item.LastName, item.Avatar)
            );

        return reviews.Select(review =>
        {
            reviewers.TryGetValue(review.ReviewerID, out var reviewer);
            string reviewerName = string.IsNullOrWhiteSpace(reviewer.FirstName) && string.IsNullOrWhiteSpace(reviewer.LastName)
                ? string.Empty
                : $"{reviewer.FirstName} {reviewer.LastName}".Trim();

            return new ReviewModel
            {
                ReviewID = review.ReviewID,
                ReviewerID = review.ReviewerID,
                ReviewedUserID = review.ReviewedUserID,
                Rating = review.Rating,
                Comment = review.Comment,
                Timestamp = review.Timestamp,
                ReviewerName = reviewerName,
                ReviewerAvatar = reviewer.Avatar
            };
        }).ToList();
    }

    public bool HasReviewed(int reviewerId, int reviewedUserId)
    {
        return _dbContext.Reviews
            .AsNoTracking()
            .Any(item => item.ReviewerID == reviewerId && item.ReviewedUserID == reviewedUserId);
    }
}

public sealed class RoleDataAccessAdapter : IRoleDataAccess
{
    private readonly TijarahJoDbContext _dbContext;

    public RoleDataAccessAdapter(TijarahJoDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public RoleModel GetRoleByID(int? roleId)
    {
        if (!roleId.HasValue || roleId.Value < 1)
        {
            return null!;
        }

        RoleEntity? entity = _dbContext.Roles
            .AsNoTracking()
            .FirstOrDefault(item => item.RoleID == roleId.Value);
        return entity is null ? null! : ToModel(entity);
    }

    public int AddRole(RoleModel role)
    {
        var entity = new RoleEntity
        {
            RoleName = role.RoleName,
            CreatedAt = role.CreatedAt == default ? DateTime.UtcNow : role.CreatedAt,
            IsDeleted = role.IsDeleted
        };

        _dbContext.Roles.Add(entity);
        _dbContext.SaveChanges();
        return entity.RoleID;
    }

    public bool UpdateRole(RoleModel role)
    {
        if (!role.RoleID.HasValue || role.RoleID.Value < 1)
        {
            return false;
        }

        RoleEntity? entity = _dbContext.Roles
            .FirstOrDefault(item => item.RoleID == role.RoleID.Value);
        if (entity is null)
        {
            return false;
        }

        entity.RoleName = role.RoleName;
        entity.CreatedAt = role.CreatedAt == default ? entity.CreatedAt : role.CreatedAt;
        entity.IsDeleted = role.IsDeleted;

        return _dbContext.SaveChanges() > 0;
    }

    public bool DeleteRole(int? roleId)
    {
        if (!roleId.HasValue || roleId.Value < 1)
        {
            return false;
        }

        RoleEntity? entity = _dbContext.Roles
            .FirstOrDefault(item => item.RoleID == roleId.Value);
        if (entity is null)
        {
            return false;
        }

        if (entity.IsDeleted)
        {
            return false;
        }

        entity.IsDeleted = true;
        return _dbContext.SaveChanges() > 0;
    }

    public bool DoesRoleExist(int? roleId)
    {
        return roleId.HasValue
               && roleId.Value > 0
               && _dbContext.Roles.AsNoTracking().Any(item => item.RoleID == roleId.Value);
    }

    public IReadOnlyList<RoleModel> GetAllRoles()
    {
        return _dbContext.Roles
            .AsNoTracking()
            .Where(item => !item.IsDeleted)
            .OrderBy(item => item.RoleID)
            .Select(ToModel)
            .ToList();
    }

    private static RoleModel ToModel(RoleEntity entity)
    {
        return new RoleModel(
            entity.RoleID,
            entity.RoleName,
            entity.CreatedAt,
            entity.IsDeleted
        );
    }
}

public sealed class UserDataAccessAdapter : IUserDataAccess
{
    private readonly TijarahJoDbContext _dbContext;

    public UserDataAccessAdapter(TijarahJoDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public UserModel GetUserByID(int? userId)
    {
        if (!userId.HasValue || userId.Value < 1)
        {
            return null!;
        }

        UserEntity? entity = _dbContext.Users
            .AsNoTracking()
            .FirstOrDefault(item => item.UserID == userId.Value);
        return entity is null ? null! : ToModel(entity);
    }

    public int AddUser(UserModel user)
    {
        var entity = new UserEntity
        {
            HashedPassword = user.HashedPassword,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Phone = user.Phone,
            City = user.City,
            Area = user.Area,
            Bio = user.Bio,
            Avatar = user.Avatar,
            JoinDate = user.JoinDate == default ? DateTime.UtcNow : user.JoinDate,
            Status = user.Status,
            RoleID = user.RoleID,
            IsDeleted = user.IsDeleted
        };

        _dbContext.Users.Add(entity);
        _dbContext.SaveChanges();
        return entity.UserID;
    }

    public bool UpdateUser(UserModel user)
    {
        if (!user.UserID.HasValue || user.UserID.Value < 1)
        {
            return false;
        }

        UserEntity? entity = _dbContext.Users
            .FirstOrDefault(item => item.UserID == user.UserID.Value);
        if (entity is null)
        {
            return false;
        }

        entity.HashedPassword = string.IsNullOrWhiteSpace(user.HashedPassword)
            ? entity.HashedPassword
            : user.HashedPassword;
        entity.Email = user.Email;
        entity.FirstName = user.FirstName;
        entity.LastName = user.LastName;
        entity.Phone = user.Phone;
        entity.City = user.City;
        entity.Area = user.Area;
        entity.Bio = user.Bio;
        entity.Avatar = user.Avatar;
        entity.JoinDate = user.JoinDate == default ? entity.JoinDate : user.JoinDate;
        entity.Status = user.Status;
        entity.RoleID = user.RoleID;
        entity.IsDeleted = user.IsDeleted;

        return _dbContext.SaveChanges() > 0;
    }

    public bool DeleteUser(int? userId)
    {
        if (!userId.HasValue || userId.Value < 1)
        {
            return false;
        }

        UserEntity? entity = _dbContext.Users
            .FirstOrDefault(item => item.UserID == userId.Value);
        if (entity is null)
        {
            return false;
        }

        if (entity.IsDeleted)
        {
            return false;
        }

        _dbContext.Favorites
            .Where(item => item.UserID == userId.Value && !item.IsDeleted)
            .ExecuteUpdate(setters => setters.SetProperty(item => item.IsDeleted, true));

        entity.IsDeleted = true;
        return _dbContext.SaveChanges() > 0;
    }

    public bool DoesUserExist(int? userId)
    {
        return userId.HasValue
               && userId.Value > 0
               && _dbContext.Users.AsNoTracking().Any(item => item.UserID == userId.Value);
    }

    public IReadOnlyList<UserModel> GetAllUsers()
    {
        return _dbContext.Users
            .AsNoTracking()
            .Where(item => !item.IsDeleted)
            .OrderBy(item => item.UserID)
            .Select(ToModel)
            .ToList();
    }

    public UserModel GetUserByLoginAndPassword(string login, string hashedPassword)
    {
        if (string.IsNullOrWhiteSpace(login) || string.IsNullOrWhiteSpace(hashedPassword))
        {
            return null!;
        }

        string trimmedLogin = login.Trim();
        IQueryable<UserEntity> query = _dbContext.Users
            .AsNoTracking()
            .Where(item => !item.IsDeleted && item.HashedPassword == hashedPassword);

        if (trimmedLogin.Contains('@'))
        {
            query = query.Where(item => item.Email == trimmedLogin);
        }
        else
        {
            string phoneLookup = NormalizePhoneLookup(trimmedLogin) ?? trimmedLogin;
            query = query.Where(item => item.Phone == phoneLookup);
        }

        UserEntity? entity = query.FirstOrDefault();
        return entity is null ? null! : ToModel(entity);
    }

    public UserModel GetUserByLogin(string login)
    {
        if (string.IsNullOrWhiteSpace(login))
        {
            return null!;
        }

        string trimmedLogin = login.Trim();
        IQueryable<UserEntity> query = _dbContext.Users
            .AsNoTracking()
            .Where(item => !item.IsDeleted);

        if (trimmedLogin.Contains('@'))
        {
            query = query.Where(item => item.Email == trimmedLogin);
        }
        else
        {
            string? normalizedPhone = NormalizePhoneLookup(trimmedLogin);
            if (!string.IsNullOrWhiteSpace(normalizedPhone))
            {
                query = query.Where(item => item.Phone == normalizedPhone);
            }
            else
            {
                query = query.Where(item => item.Email == trimmedLogin);
            }
        }

        UserEntity? entity = query.FirstOrDefault();
        return entity is null ? null! : ToModel(entity);
    }

    private static string? NormalizePhoneLookup(string rawLogin)
    {
        string trimmed = rawLogin.Trim();
        if (trimmed.Length == 0)
        {
            return null;
        }

        string digitsOnly = new(trimmed.Where(char.IsDigit).ToArray());
        if (digitsOnly.Length == 12 && digitsOnly.StartsWith("962", StringComparison.Ordinal))
        {
            return $"+962{digitsOnly[^9..]}";
        }

        if (digitsOnly.Length == 10 && digitsOnly.StartsWith("0", StringComparison.Ordinal))
        {
            return $"+962{digitsOnly[^9..]}";
        }

        if (digitsOnly.Length == 9)
        {
            return $"+962{digitsOnly}";
        }

        if (trimmed.StartsWith("+962", StringComparison.Ordinal) && trimmed.Length == 13)
        {
            return trimmed;
        }

        return null;
    }

    private static UserModel ToModel(UserEntity entity)
    {
        return new UserModel(
            entity.UserID,
            entity.HashedPassword,
            entity.Email,
            entity.FirstName,
            entity.LastName ?? string.Empty,
            entity.Phone,
            entity.City,
            entity.Area,
            entity.Bio,
            entity.Avatar,
            entity.JoinDate,
            entity.Status,
            entity.RoleID,
            entity.IsDeleted
        );
    }
}
