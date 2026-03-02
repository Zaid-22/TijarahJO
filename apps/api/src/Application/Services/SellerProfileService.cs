using System.Globalization;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.Application.Abstractions.DataAccess;
using TijarahJoDB.Application.Common;
using TijarahJo.Domain.Models;

namespace TijarahJoDB.Application.Services;

public sealed class SellerProfileService : ISellerProfileService
{
    private const int MaxSellerProfilePosts = 200;
    private readonly IUserDataAccess _users;
    private readonly ISellerReadService _sellerReads;
    private readonly IPostListingQueryService _postListingQueries;

    public SellerProfileService(
        IUserDataAccess users,
        ISellerReadService sellerReads,
        IPostListingQueryService postListingQueries)
    {
        _users = users;
        _sellerReads = sellerReads;
        _postListingQueries = postListingQueries;
    }

    public async Task<SellerProfileResult> GetProfileAsync(int sellerId, CancellationToken cancellationToken = default)
    {
        if (sellerId < 1)
        {
            return Failure(SellerProfileFailureReason.InvalidRequest, $"Invalid seller ID: {sellerId}");
        }

        UserModel? seller = await _users.GetUserByIDAsync(sellerId, cancellationToken);
        if (seller == null || seller.IsDeleted)
        {
            return Failure(SellerProfileFailureReason.NotFound, $"Seller with ID {sellerId} not found.");
        }

        string sellerName = BuildDisplayName(seller);
        string sellerPhone = seller.Phone ?? string.Empty;

        PostListingPageResult page = await _postListingQueries.QueryAsync(new PostListingQuery
        {
            Page = 1,
            Limit = MaxSellerProfilePosts,
            Visibility = PostListingVisibilityMode.PublicVisible,
            SortField = PostListingSortField.CreatedAt,
            SortAscending = false,
            UserId = sellerId
        }, cancellationToken);

        IReadOnlyList<SellerPostReadModel> posts = page.Posts
            .Select(row => MapPost(row, sellerId, sellerName, sellerPhone))
            .ToList();

        int activeListingsCount = posts.Count(post => string.Equals(post.Status, "ACTIVE", StringComparison.OrdinalIgnoreCase));
        int soldListingsCount = posts.Count(post => string.Equals(post.Status, "SOLD", StringComparison.OrdinalIgnoreCase));
        string sellerCity = posts
            .Select(post => post.Location)
            .FirstOrDefault(location =>
                !string.IsNullOrWhiteSpace(location) &&
                !string.Equals(location, "Jordan", StringComparison.OrdinalIgnoreCase))
            ?? string.Empty;
        string sellerArea = posts
            .Select(post => post.Area)
            .FirstOrDefault(area => !string.IsNullOrWhiteSpace(area))
            ?? string.Empty;

        return new SellerProfileResult
        {
            Success = true,
            Profile = new SellerProfileReadModel
            {
                Seller = new SellerSummaryReadModel
                {
                    Id = sellerId.ToString(CultureInfo.InvariantCulture),
                    Name = sellerName,
                    Phone = sellerPhone,
                    City = sellerCity,
                    Area = sellerArea,
                    Bio = string.Empty,
                    Avatar = string.Empty,
                    JoinedDate = seller.JoinDate.ToString("o"),
                    ActiveListingsCount = activeListingsCount,
                    TotalSalesCount = soldListingsCount
                },
                Posts = posts
            }
        };
    }

    public async Task<TopSellersResult> GetTopSellersAsync(int takeCount = 10, CancellationToken cancellationToken = default)
    {
        int safeTake = Math.Clamp(takeCount, 1, 50);
        try
        {
            IReadOnlyList<TopSellerReadModel> sellers = await _sellerReads.GetTopSellersAsync(safeTake, cancellationToken);
            return new TopSellersResult
            {
                Success = true,
                Sellers = sellers
            };
        }
        catch (Exception)
        {
            return new TopSellersResult
            {
                Success = false,
                FailureReason = SellerProfileFailureReason.Unexpected,
                Message = "Failed to fetch top sellers."
            };
        }
    }

    private static SellerPostReadModel MapPost(PostListingRow row, int sellerId, string sellerName, string sellerPhone)
    {
        string status = PostStatusPolicy.TryNormalizeClientStatus(row.ClientStatus, out string normalizedStatus)
            ? normalizedStatus
            : "ACTIVE";

        IReadOnlyList<string> images = row.Images;
        return new SellerPostReadModel
        {
            Id = row.PostId.ToString(CultureInfo.InvariantCulture),
            Name = row.PostTitle,
            Price = row.Price,
            Location = string.IsNullOrWhiteSpace(row.City) ? "Jordan" : row.City,
            Area = string.IsNullOrWhiteSpace(row.Area) ? null : row.Area,
            Seller = sellerName,
            SellerId = sellerId.ToString(CultureInfo.InvariantCulture),
            Category = row.CategoryName,
            CategoryId = row.CategoryId.ToString(CultureInfo.InvariantCulture),
            Image = images.Count > 0 ? images[0] : string.Empty,
            Images = images,
            Phone = sellerPhone,
            Description = row.PostDescription,
            CreatedAt = row.CreatedAt.ToString("o"),
            UpdatedAt = row.CreatedAt.ToString("o"),
            Views = row.Views,
            Status = status
        };
    }

    private static string BuildDisplayName(UserModel user)
    {
        string fullName = $"{user.FirstName} {user.LastName}".Trim();
        return !string.IsNullOrWhiteSpace(fullName) ? fullName : user.Email;
    }

    private static SellerProfileResult Failure(SellerProfileFailureReason reason, string message)
    {
        return new SellerProfileResult
        {
            Success = false,
            FailureReason = reason,
            Message = message
        };
    }
}
