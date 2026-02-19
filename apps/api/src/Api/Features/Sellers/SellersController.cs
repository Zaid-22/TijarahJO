using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.Application.Common;
using TijarahJoDB.BLL;

namespace TijarahJoDBAPI.Features.Sellers
{
    [ApiController]
    [Route("api/sellers")]
    public class SellersController : ControllerBase
    {
        private readonly IUserService _users;
        private readonly IPostService _posts;
        private readonly ICategoryService _categories;
        private readonly IPostImageService _postImages;
        private readonly ISellerReadService _sellerReads;

        public SellersController(
            IUserService users,
            IPostService posts,
            ICategoryService categories,
            IPostImageService postImages,
            ISellerReadService sellerReads
        )
        {
            _users = users;
            _posts = posts;
            _categories = categories;
            _postImages = postImages;
            _sellerReads = sellerReads;
        }

        [HttpGet("{sellerId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult GetSellerProfile(string sellerId)
        {
            if (!int.TryParse(sellerId, out int parsedSellerId) || parsedSellerId < 1)
            {
                return BadRequest(new { message = $"Invalid seller ID: {sellerId}" });
            }

            UserAccount? seller = _users.Find(parsedSellerId);
            if (seller == null || seller.IsDeleted)
            {
                return NotFound(new { message = $"Seller with ID {parsedSellerId} not found." });
            }

            string sellerName = BuildDisplayName(seller);
            string sellerPhone = seller.Phone ?? string.Empty;
            var sellerPosts = MapPostsForSeller(parsedSellerId, sellerName, sellerPhone);
            int activeListingsCount = sellerPosts.Count(post => GetClientStatus(post.DbStatus, post.IsDeleted) != "DELETED");
            int soldListingsCount = sellerPosts.Count(post => GetClientStatus(post.DbStatus, post.IsDeleted) == "SOLD");

            return Ok(new
            {
                success = true,
                seller = new
                {
                    id = parsedSellerId.ToString(CultureInfo.InvariantCulture),
                    name = sellerName,
                    phone = sellerPhone,
                    city = string.Empty,
                    area = string.Empty,
                    bio = string.Empty,
                    avatar = string.Empty,
                    joinedDate = seller.JoinDate.ToString("o"),
                    activeListingsCount,
                    totalSalesCount = soldListingsCount
                },
                posts = sellerPosts.Select(ToClientPost).ToList()
            });
        }

        [HttpGet("top")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public ActionResult GetTopSellers()
        {
            try
            {
                var sellers = _sellerReads.GetTopSellers(10);
                return Ok(sellers.Select(item => new
                {
                    id = item.Id,
                    name = item.Name,
                    phone = item.Phone,
                    city = item.City,
                    area = item.Area,
                    avatar = item.Avatar,
                    joinedDate = item.JoinedDate,
                    activeListingsCount = item.ActiveListingsCount,
                    totalSalesCount = item.TotalSalesCount,
                    totalViews = item.TotalViews
                }).ToList());
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "Failed to fetch top sellers.",
                    detail = ex.Message
                });
            }
        }

        private class SellerPostRecord
        {
            public int PostId { get; set; }
            public int UserId { get; set; }
            public int CategoryId { get; set; }
            public string Name { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
            public decimal Price { get; set; }
            public string Location { get; set; } = "Jordan";
            public string? Area { get; set; }
            public string CategoryName { get; set; } = string.Empty;
            public DateTime CreatedAt { get; set; }
            public int Views { get; set; }
            public int DbStatus { get; set; }
            public bool IsDeleted { get; set; }
            public string SellerName { get; set; } = string.Empty;
            public string SellerPhone { get; set; } = string.Empty;
            public List<string> Images { get; set; } = new List<string>();
        }

        private List<SellerPostRecord> MapPostsForSeller(int sellerId, string sellerName, string sellerPhone)
        {
            IReadOnlyList<Models.PostModel> posts = _posts.GetPostsByUserId(sellerId);
            var categoryLookup = BuildCategoryLookup();
            var imageLookup = BuildPostImageLookup();
            var records = new List<SellerPostRecord>();

            foreach (var post in posts)
            {
                int postId = post.PostID ?? 0;
                int categoryId = post.CategoryID;
                string city = post.City ?? string.Empty;
                string area = post.Area ?? string.Empty;

                records.Add(new SellerPostRecord
                {
                    PostId = postId,
                    UserId = sellerId,
                    CategoryId = categoryId,
                    Name = post.PostTitle,
                    Description = post.PostDescription,
                    Price = post.Price ?? 0m,
                    Location = string.IsNullOrWhiteSpace(city) ? "Jordan" : city,
                    Area = string.IsNullOrWhiteSpace(area) ? null : area,
                    CategoryName = categoryLookup.TryGetValue(categoryId, out string? categoryName)
                        ? categoryName
                        : string.Empty,
                    CreatedAt = post.CreatedAt,
                    Views = post.Views,
                    DbStatus = post.Status,
                    IsDeleted = post.IsDeleted,
                    SellerName = sellerName,
                    SellerPhone = sellerPhone,
                    Images = imageLookup.TryGetValue(postId, out List<string>? images)
                        ? images
                        : new List<string>()
                });
            }

            return records;
        }

        private static object ToClientPost(SellerPostRecord record)
        {
            string status = GetClientStatus(record.DbStatus, record.IsDeleted);
            return new
            {
                id = record.PostId.ToString(CultureInfo.InvariantCulture),
                name = record.Name,
                price = record.Price,
                location = record.Location,
                area = record.Area,
                seller = record.SellerName,
                sellerId = record.UserId.ToString(CultureInfo.InvariantCulture),
                category = record.CategoryName,
                categoryId = record.CategoryId.ToString(CultureInfo.InvariantCulture),
                image = record.Images.FirstOrDefault() ?? string.Empty,
                images = record.Images,
                phone = record.SellerPhone,
                description = record.Description,
                createdAt = record.CreatedAt.ToString("o"),
                updatedAt = record.CreatedAt.ToString("o"),
                views = record.Views,
                status
            };
        }

        private static string GetClientStatus(int dbStatus, bool isDeleted)
        {
            return PostStatusPolicy.ToClientStatus(dbStatus, isDeleted);
        }

        private Dictionary<int, string> BuildCategoryLookup()
        {
            var lookup = new Dictionary<int, string>();
            IReadOnlyList<Models.CategoryModel> categories = _categories.GetAllCategories();
            foreach (var category in categories)
            {
                int categoryId = category.CategoryID ?? 0;
                if (categoryId < 1)
                {
                    continue;
                }

                string categoryName = category.CategoryName;
                if (!string.IsNullOrWhiteSpace(categoryName))
                {
                    lookup[categoryId] = categoryName;
                }
            }

            return lookup;
        }

        private Dictionary<int, List<string>> BuildPostImageLookup()
        {
            var lookup = new Dictionary<int, List<string>>();
            IReadOnlyList<Models.PostImageModel> images = _postImages.GetAllPostImages();
            foreach (var image in images)
            {
                int postId = image.PostID;
                if (postId < 1 || image.IsDeleted)
                {
                    continue;
                }

                string url = image.PostImageURL;
                if (string.IsNullOrWhiteSpace(url))
                {
                    continue;
                }

                if (!lookup.TryGetValue(postId, out List<string>? urls))
                {
                    urls = new List<string>();
                    lookup[postId] = urls;
                }

                if (!urls.Contains(url))
                {
                    urls.Add(url);
                }
            }

            return lookup;
        }

        private static string BuildDisplayName(UserAccount user)
        {
            string fullName = $"{user.FirstName} {user.LastName}".Trim();
            if (!string.IsNullOrWhiteSpace(fullName))
            {
                return fullName;
            }
            return user.Email;
        }
    }
}
