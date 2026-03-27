using System.Threading;
using System.Threading.Tasks;

namespace TijarahJo.Application.Abstractions.Services;

public enum PostListingVisibilityMode
{
    PublicVisible,
    All,
    NonDeletedAnyStatus,
    ActiveOnly,
    SoldOnly,
    DeletedOnly
}

public enum PostListingSortField
{
    CreatedAt,
    Price,
    Views
}

public sealed class PostListingQuery
{
    public int Page { get; init; } = 1;
    public int Limit { get; init; } = 20;
    public PostListingVisibilityMode Visibility { get; init; } = PostListingVisibilityMode.PublicVisible;
    public PostListingSortField SortField { get; init; } = PostListingSortField.CreatedAt;
    public bool SortAscending { get; init; }
    public string? SearchTerm { get; init; }
    public int? CategoryId { get; init; }
    public string? CategoryNameLike { get; init; }
    public string? CityLike { get; init; }
    public decimal? MinPrice { get; init; }
    public decimal? MaxPrice { get; init; }
    public int? UserId { get; init; }
}

public sealed class PostListingRow
{
    public int PostId { get; init; }
    public int UserId { get; init; }
    public int CategoryId { get; init; }
    public string PostTitle { get; init; } = string.Empty;
    public string PostDescription { get; init; } = string.Empty;
    public decimal Price { get; init; }
    public string City { get; init; } = string.Empty;
    public string Area { get; init; } = string.Empty;
    public string SellerName { get; init; } = string.Empty;
    public string CategoryName { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public long Views { get; init; }
    public string ClientStatus { get; init; } = "ACTIVE";
    public IReadOnlyList<string> Images { get; init; } = Array.Empty<string>();
}

public sealed class PostListingPageResult
{
    public int Page { get; init; }
    public int Limit { get; init; }
    public int TotalPosts { get; init; }
    public IReadOnlyList<PostListingRow> Posts { get; init; } = Array.Empty<PostListingRow>();
}

public interface IPostListingQueryService
{
    Task<PostListingPageResult> QueryAsync(PostListingQuery query, CancellationToken cancellationToken = default);
}

public sealed class SearchQueryModel
{
    public string? Query { get; set; }
    public string? Category { get; set; }
    public string? City { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string? Status { get; set; }
    public string? SortBy { get; set; } = "date";
    public string? SortOrder { get; set; } = "desc";
    public int? Page { get; set; } = 1;
    public int? Limit { get; set; } = 20;
}

public sealed class SearchPostReadModel
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required decimal Price { get; init; }
    public required string Location { get; init; }
    public string? Area { get; init; }
    public required string Seller { get; init; }
    public required string SellerId { get; init; }
    public required string Category { get; init; }
    public required string CategoryId { get; init; }
    public required string Image { get; init; }
    public required IReadOnlyList<string> Images { get; init; }
    public required string Phone { get; init; }
    public required string Description { get; init; }
    public required string CreatedAt { get; init; }
    public required string UpdatedAt { get; init; }
    public required long Views { get; init; }
    public required string Status { get; init; }
}

public sealed class SearchPaginationReadModel
{
    public required int CurrentPage { get; init; }
    public required int TotalPages { get; init; }
    public required int TotalPosts { get; init; }
    public required int PostsPerPage { get; init; }
}

public sealed class SearchReadResult
{
    public required bool Success { get; init; }
    public required IReadOnlyList<SearchPostReadModel> Posts { get; init; }
    public required SearchPaginationReadModel Pagination { get; init; }
}

public interface ISearchReadService
{
    Task<SearchReadResult> SearchAsync(SearchQueryModel query, CancellationToken cancellationToken = default);
}

public sealed class TopSellerReadModel
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required string Phone { get; init; }
    public required string City { get; init; }
    public required string Area { get; init; }
    public required string Avatar { get; init; }
    public required string JoinedDate { get; init; }
    public required int ActiveListingsCount { get; init; }
    public required int TotalSalesCount { get; init; }
    public required long TotalViews { get; init; }
}

public interface ISellerReadService
{
    Task<IReadOnlyList<TopSellerReadModel>> GetTopSellersAsync(int takeCount = 10, CancellationToken cancellationToken = default);
}

public sealed class CityLookupResult
{
    public int CityId { get; init; }
    public string CityName { get; init; } = string.Empty;
}

public sealed class AreaLookupResult
{
    public int AreaId { get; init; }
    public string AreaName { get; init; } = string.Empty;
    public int CityId { get; init; }
}

public interface ILocationReadService
{
    Task<IReadOnlyList<CityLookupResult>> GetCitiesAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AreaLookupResult>> GetAreasByCityAsync(int cityId, CancellationToken cancellationToken = default);
}
