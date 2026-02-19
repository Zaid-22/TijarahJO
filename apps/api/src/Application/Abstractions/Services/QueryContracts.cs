using System.Globalization;

namespace TijarahJoDB.Application.Abstractions.Services;

public sealed class SearchQueryRequestModel
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

public sealed class SearchPostResult
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
    public required int Views { get; init; }
    public required string Status { get; init; }
}

public sealed class SearchPaginationResult
{
    public required int CurrentPage { get; init; }
    public required int TotalPages { get; init; }
    public required int TotalPosts { get; init; }
    public required int PostsPerPage { get; init; }
}

public sealed class SearchResult
{
    public required bool Success { get; init; }
    public required IReadOnlyList<SearchPostResult> Posts { get; init; }
    public required SearchPaginationResult Pagination { get; init; }
}

public interface ISearchReadService
{
    SearchResult Search(SearchQueryRequestModel query);
}

public sealed class TopSellerResult
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
    public required int TotalViews { get; init; }
}

public interface ISellerReadService
{
    IReadOnlyList<TopSellerResult> GetTopSellers(int takeCount = 10);
}
