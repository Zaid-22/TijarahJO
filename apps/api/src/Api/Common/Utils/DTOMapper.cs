using TijarahJo.Domain.Models;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDBAPI.Contracts.Responses;

namespace TijarahJoDBAPI.Common.Utils;

public static class DTOMapper
{
    public static UserResponseDTO ToUserResponseDTO(UserModel userModel)
    {
        return new UserResponseDTO
        {
            Id = userModel.UserID?.ToString() ?? "",
            Email = userModel.Email,
            FirstName = userModel.FirstName,
            LastName = userModel.LastName ?? "",
            Phone = userModel.Phone,
            CityId = userModel.CityId,
            AreaId = userModel.AreaId,
            Bio = userModel.Bio,
            Avatar = userModel.Avatar,
            JoinedDate = userModel.JoinDate,
            Status = userModel.Status,
            RoleID = userModel.RoleID,
            IsDeleted = userModel.IsDeleted
        };
    }

    public static CategoryResponseDTO ToCategoryResponseDTO(CategoryModel categoryModel)
    {
        return new CategoryResponseDTO
        {
            CategoryID = categoryModel.CategoryID ?? 0,
            Id = categoryModel.CategoryID?.ToString() ?? string.Empty,
            CategoryName = categoryModel.CategoryName ?? string.Empty,
            NameAr = categoryModel.NameAr,
            Icon = categoryModel.Icon,
            Color = categoryModel.Color,
            Image = categoryModel.Image,
            CreatedAt = categoryModel.CreatedAt,
            IsDeleted = categoryModel.IsDeleted
        };
    }

    public static RoleResponseDTO ToRoleResponseDTO(RoleModel roleModel)
    {
        return new RoleResponseDTO
        {
            RoleID = roleModel.RoleID ?? 0,
            Id = roleModel.RoleID?.ToString() ?? string.Empty,
            RoleName = roleModel.RoleName ?? string.Empty,
            CreatedAt = roleModel.CreatedAt,
            IsDeleted = roleModel.IsDeleted
        };
    }

    public static PostResponseDTO ToPostResponseDTO(PostModel postModel)
    {
        return new PostResponseDTO
        {
            PostID = postModel.PostID ?? 0,
            Id = postModel.PostID?.ToString() ?? string.Empty,
            CategoryID = postModel.CategoryID,
            PostTitle = postModel.PostTitle ?? string.Empty,
            PostDescription = postModel.PostDescription ?? string.Empty,
            Price = postModel.Price,
            Status = postModel.Status,
            CreatedAt = postModel.CreatedAt,
            IsDeleted = postModel.IsDeleted,
            Views = postModel.Views,
            CityId = postModel.CityId,
            AreaId = postModel.AreaId,
            Images = Array.Empty<string>() // Provide base empty array, images generally fetched separately
        };
    }

    public static PostImageResponseDTO ToPostImageResponseDTO(PostImageModel postImageModel)
    {
        return new PostImageResponseDTO
        {
            PostImageID = postImageModel.PostImageID ?? 0,
            Id = postImageModel.PostImageID?.ToString() ?? string.Empty,
            PostID = postImageModel.PostID,
            PostImageURL = postImageModel.PostImageURL ?? string.Empty,
            UploadedAt = postImageModel.UploadedAt,
            IsDeleted = postImageModel.IsDeleted
        };
    }

    public static ReviewResponseDTO ToReviewResponseDTO(ReviewModel reviewModel)
    {
        return new ReviewResponseDTO
        {
            ReviewID = reviewModel.ReviewID ?? 0,
            Id = reviewModel.ReviewID?.ToString() ?? string.Empty,
            ReviewerID = reviewModel.ReviewerID,
            ReviewedUserID = reviewModel.ReviewedUserID,
            Rating = reviewModel.Rating,
            Comment = reviewModel.Comment ?? string.Empty,
            Timestamp = reviewModel.Timestamp,
            ReviewerName = reviewModel.ReviewerName,
            ReviewerAvatar = reviewModel.ReviewerAvatar
        };
    }

    public static MessageResponseDTO ToMessageResponseDTO(MessageModel messageModel, int receiverId, int? postId = null)
    {
        return new MessageResponseDTO
        {
            MessageId = messageModel.MessageId ?? 0,
            Id = messageModel.MessageId?.ToString() ?? string.Empty,
            SenderId = messageModel.SenderId,
            ReceiverId = receiverId,
            ConversationId = messageModel.ConversationId,
            PostId = postId,
            Content = messageModel.Content ?? string.Empty,
            Timestamp = messageModel.Timestamp,
            IsRead = messageModel.IsRead
        };
    }

    public static MessageResponseDTO ToMessageResponseDTO(MessageModel messageModel)
    {
        int receiverId = messageModel.ReceiverId ?? 0;
        return ToMessageResponseDTO(messageModel, receiverId, messageModel.PostId);
    }

    public static SearchResponseDTO ToSearchResponseDTO(SearchReadResult readResult)
    {
        return new SearchResponseDTO
        {
            Success = readResult.Success,
            Posts = readResult.Posts.Select(post => new SearchPostResponseDTO
            {
                Id = post.Id,
                Name = post.Name,
                Price = post.Price,
                Location = post.Location,
                Area = post.Area,
                Seller = post.Seller,
                SellerId = post.SellerId,
                Category = post.Category,
                CategoryId = post.CategoryId,
                Image = "", // Not returning images in search by default
                Phone = post.Phone,
                Description = post.Description,
                CreatedAt = post.CreatedAt,
                UpdatedAt = post.UpdatedAt,
                Views = post.Views,
                Status = post.Status
            }).ToList(),
            Pagination = new SearchPaginationResponseDTO
            {
                CurrentPage = readResult.Pagination.CurrentPage,
                TotalPages = readResult.Pagination.TotalPages,
                TotalPosts = readResult.Pagination.TotalPosts,
                PostsPerPage = readResult.Pagination.PostsPerPage
            }
        };
    }

    public static TopSellerResponseDTO ToTopSellerResponseDTO(TopSellerReadModel seller)
    {
        return new TopSellerResponseDTO
        {
            Id = seller.Id,
            Name = seller.Name,
            Phone = seller.Phone,
            City = seller.City,
            Area = seller.Area,
            Avatar = seller.Avatar,
            JoinedDate = seller.JoinedDate,
            ActiveListingsCount = seller.ActiveListingsCount,
            TotalSalesCount = seller.TotalSalesCount,
            TotalViews = seller.TotalViews
        };
    }

    public static SellerProfileResponseDTO ToSellerProfileResponseDTO(SellerProfileReadModel profile)
    {
        return new SellerProfileResponseDTO
        {
            Success = true,
            Seller = new SellerSummaryResponseDTO
            {
                Id = profile.Seller.Id,
                Name = profile.Seller.Name,
                Phone = profile.Seller.Phone,
                City = profile.Seller.City,
                Area = profile.Seller.Area,
                Bio = profile.Seller.Bio,
                Avatar = profile.Seller.Avatar,
                JoinedDate = profile.Seller.JoinedDate,
                ActiveListingsCount = profile.Seller.ActiveListingsCount,
                TotalSalesCount = profile.Seller.TotalSalesCount
            },
            Posts = profile.Posts.Select(post => new SellerPostResponseDTO
            {
                Id = post.Id,
                Name = post.Name,
                Price = post.Price,
                Location = post.Location,
                Area = post.Area,
                Seller = post.Seller,
                SellerId = post.SellerId,
                Category = post.Category,
                CategoryId = post.CategoryId,
                Image = post.Image,
                Images = post.Images.ToList(),
                Phone = post.Phone,
                Description = post.Description,
                CreatedAt = post.CreatedAt,
                UpdatedAt = post.UpdatedAt,
                Views = post.Views,
                Status = post.Status
            }).ToList()
        };
    }

    public static NotificationResponseDTO ToNotificationResponseDTO(NotificationEnvelope notification)
    {
        return new NotificationResponseDTO
        {
            NotificationId = notification.NotificationId,
            NotificationType = notification.NotificationType,
            Title = notification.Title,
            Body = notification.Body,
            SenderUserId = notification.SenderUserId,
            ConversationId = notification.ConversationId,
            MessageId = notification.MessageId,
            RouteUrl = notification.RouteUrl,
            IsRead = notification.IsRead,
            CreatedAt = notification.CreatedAt,
            ReadAt = notification.ReadAt
        };
    }
}
