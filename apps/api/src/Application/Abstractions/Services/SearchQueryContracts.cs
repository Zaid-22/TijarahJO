using System.ComponentModel.DataAnnotations;

namespace TijarahJo.Application.Abstractions.Services;

public sealed class SearchRequestQuery
{
    [StringLength(200)]
    public string? Query { get; set; }

    [StringLength(100)]
    public string? Category { get; set; }

    [StringLength(100)]
    public string? City { get; set; }

    [Range(typeof(decimal), "0", "999999999999999999")]
    public decimal? MinPrice { get; set; }

    [Range(typeof(decimal), "0", "999999999999999999")]
    public decimal? MaxPrice { get; set; }

    [RegularExpression(
        "^(?i)(ACTIVE|SOLD)$",
        ErrorMessage = "Status must be one of: ACTIVE, SOLD."
    )]
    public string? Status { get; set; }

    [RegularExpression(
        "^(?i)(date|price|views)$",
        ErrorMessage = "SortBy must be one of: date, price, views."
    )]
    public string? SortBy { get; set; } = "date";

    [RegularExpression(
        "^(?i)(asc|desc)$",
        ErrorMessage = "SortOrder must be one of: asc, desc."
    )]
    public string? SortOrder { get; set; } = "desc";

    [Range(1, int.MaxValue)]
    public int? Page { get; set; } = 1;

    [Range(1, 200)]
    public int? Limit { get; set; } = 20;
}

public interface ISearchQueryHandler
{
    Task<SearchQueryResult> SearchAsync(SearchRequestQuery request, CancellationToken cancellationToken = default);
}

public interface ISearchCacheInvalidationService
{
    void InvalidateAll();
}

public sealed class SearchQueryResult
{
    public bool Success { get; init; }
    public SearchReadResult? Result { get; init; }
    public int StatusCode { get; init; }
    public string? Message { get; init; }
}
