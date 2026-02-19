using Microsoft.Data.SqlClient;
using TijarahJoDB.Application.Common;
using TijarahJoDB_DataAccess;

namespace TijarahJoDB.DAL.Queries;

public enum PostListingVisibilityMode
{
    PublicVisible,
    All,
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
    public int Views { get; init; }
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

public sealed class PostListingQueryService
{
    public PostListingPageResult Query(PostListingQuery query)
    {
        int page = query.Page < 1 ? 1 : query.Page;
        int limit = query.Limit < 1 ? 20 : query.Limit;
        if (limit > 500)
        {
            limit = 500;
        }

        int offset = (page - 1) * limit;
        var filters = new List<string>();

        using var connection = new SqlConnection(DataAccessSettings.ConnectionString);
        using var command = connection.CreateCommand();
        command.Parameters.AddWithValue("@ActiveStatus", PostStatusPolicy.Active);
        command.Parameters.AddWithValue("@BlockedStatus", PostStatusPolicy.Blocked);
        command.Parameters.AddWithValue("@DeletedStatus", PostStatusPolicy.Deleted);
        command.Parameters.AddWithValue("@SoldStatus", PostStatusPolicy.Sold);

        if (!string.IsNullOrWhiteSpace(query.SearchTerm))
        {
            filters.Add(@"(
p.SearchTitleNormalized LIKE @SearchPrefix ESCAPE '\' OR
p.SearchDescriptionPrefixNormalized LIKE @SearchPrefix ESCAPE '\' OR
c.SearchCategoryNameNormalized LIKE @SearchPrefix ESCAPE '\' OR
u.SearchFirstNameNormalized LIKE @SearchPrefix ESCAPE '\' OR
u.SearchLastNameNormalized LIKE @SearchPrefix ESCAPE '\' OR
u.SearchFullNameNormalized LIKE @SearchPrefix ESCAPE '\' OR
p.SearchCityNormalized LIKE @SearchPrefix ESCAPE '\' OR
p.SearchAreaNormalized LIKE @SearchPrefix ESCAPE '\'
)");
            command.Parameters.AddWithValue("@SearchPrefix", BuildPrefixPattern(query.SearchTerm));
        }

        if (query.CategoryId.HasValue && query.CategoryId.Value > 0)
        {
            filters.Add("p.CategoryID = @CategoryID");
            command.Parameters.AddWithValue("@CategoryID", query.CategoryId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(query.CategoryNameLike))
        {
            filters.Add("c.SearchCategoryNameNormalized LIKE @CategoryPrefix ESCAPE '\\'");
            command.Parameters.AddWithValue("@CategoryPrefix", BuildPrefixPattern(query.CategoryNameLike));
        }

        if (!string.IsNullOrWhiteSpace(query.CityLike))
        {
            filters.Add("p.SearchCityNormalized LIKE @CityPrefix ESCAPE '\\'");
            command.Parameters.AddWithValue("@CityPrefix", BuildPrefixPattern(query.CityLike));
        }

        if (query.MinPrice.HasValue)
        {
            filters.Add("p.Price >= @MinPrice");
            command.Parameters.AddWithValue("@MinPrice", query.MinPrice.Value);
        }

        if (query.MaxPrice.HasValue)
        {
            filters.Add("p.Price <= @MaxPrice");
            command.Parameters.AddWithValue("@MaxPrice", query.MaxPrice.Value);
        }

        switch (query.Visibility)
        {
            case PostListingVisibilityMode.All:
                filters.Add("1 = 1");
                break;
            case PostListingVisibilityMode.ActiveOnly:
                filters.Add("p.IsDeleted = 0 AND p.Status = @ActiveStatus");
                break;
            case PostListingVisibilityMode.SoldOnly:
                filters.Add("p.IsDeleted = 0 AND p.Status = @SoldStatus");
                break;
            case PostListingVisibilityMode.DeletedOnly:
                filters.Add("(p.IsDeleted = 1 OR p.Status IN (@BlockedStatus, @DeletedStatus))");
                break;
            default:
                filters.Add("p.IsDeleted = 0 AND p.Status IN (@ActiveStatus, @SoldStatus)");
                break;
        }

        string orderByClause = BuildOrderByClause(query.SortField, query.SortAscending);

        command.Parameters.AddWithValue("@Offset", offset);
        command.Parameters.AddWithValue("@Limit", limit);

        command.CommandText = $@"
WITH FilteredPosts AS
(
    SELECT
        p.PostID,
        p.UserID,
        p.CategoryID,
        ISNULL(p.PostTitle, '') AS PostTitle,
        ISNULL(p.PostDescription, '') AS PostDescription,
        ISNULL(p.Price, 0) AS Price,
        ISNULL(p.City, '') AS City,
        ISNULL(p.Area, '') AS Area,
        p.CreatedAt,
        ISNULL(p.Views, 0) AS Views,
        ISNULL(c.CategoryName, '') AS CategoryName,
        COALESCE(
            NULLIF(LTRIM(RTRIM(CONCAT(ISNULL(u.FirstName, ''), ' ', ISNULL(u.LastName, '')))), ''),
            NULLIF(u.Email, ''),
            CONCAT('User ', p.UserID)
        ) AS SellerName,
        ISNULL(img.ImageURLs, '') AS ImageURLs,
        {PostStatusPolicy.ToSqlCaseExpression("p")} AS ClientStatus
    FROM dbo.TbPosts AS p
    LEFT JOIN dbo.TbItemCategories AS c ON c.CategoryID = p.CategoryID
    LEFT JOIN dbo.TbUsers AS u ON u.UserID = p.UserID
    OUTER APPLY
    (
        SELECT STRING_AGG(pi.PostImageURL, ',') AS ImageURLs
        FROM dbo.TbPostImages AS pi
        WHERE pi.PostID = p.PostID
          AND ISNULL(pi.IsDeleted, 0) = 0
    ) AS img
    WHERE {string.Join(" AND ", filters)}
)
SELECT
    fp.PostID,
    fp.UserID,
    fp.CategoryID,
    fp.PostTitle,
    fp.PostDescription,
    fp.Price,
    fp.City,
    fp.Area,
    fp.SellerName,
    fp.CategoryName,
    fp.CreatedAt,
    fp.Views,
    fp.ClientStatus,
    fp.ImageURLs,
    COUNT(1) OVER() AS TotalCount
FROM FilteredPosts AS fp
ORDER BY {orderByClause}
OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";

        connection.Open();

        var posts = new List<PostListingRow>();
        int totalPosts = 0;

        using SqlDataReader reader = command.ExecuteReader();
        while (reader.Read())
        {
            int total = reader.GetInt32(reader.GetOrdinal("TotalCount"));
            if (total > totalPosts)
            {
                totalPosts = total;
            }

            string imageCsv = reader.GetString(reader.GetOrdinal("ImageURLs"));
            posts.Add(new PostListingRow
            {
                PostId = reader.GetInt32(reader.GetOrdinal("PostID")),
                UserId = reader.GetInt32(reader.GetOrdinal("UserID")),
                CategoryId = reader.GetInt32(reader.GetOrdinal("CategoryID")),
                PostTitle = reader.GetString(reader.GetOrdinal("PostTitle")),
                PostDescription = reader.GetString(reader.GetOrdinal("PostDescription")),
                Price = reader.GetDecimal(reader.GetOrdinal("Price")),
                City = reader.GetString(reader.GetOrdinal("City")),
                Area = reader.GetString(reader.GetOrdinal("Area")),
                SellerName = reader.GetString(reader.GetOrdinal("SellerName")),
                CategoryName = reader.GetString(reader.GetOrdinal("CategoryName")),
                CreatedAt = reader.GetDateTime(reader.GetOrdinal("CreatedAt")),
                Views = reader.GetInt32(reader.GetOrdinal("Views")),
                ClientStatus = reader.GetString(reader.GetOrdinal("ClientStatus")),
                Images = ParseCsvImageUrls(imageCsv)
            });
        }

        return new PostListingPageResult
        {
            Page = page,
            Limit = limit,
            TotalPosts = totalPosts,
            Posts = posts
        };
    }

    private static string BuildOrderByClause(PostListingSortField sortField, bool ascending)
    {
        return sortField switch
        {
            PostListingSortField.Price => ascending
                ? "fp.Price ASC, fp.CreatedAt DESC, fp.PostID DESC"
                : "fp.Price DESC, fp.CreatedAt DESC, fp.PostID DESC",
            PostListingSortField.Views => ascending
                ? "fp.Views ASC, fp.CreatedAt DESC, fp.PostID DESC"
                : "fp.Views DESC, fp.CreatedAt DESC, fp.PostID DESC",
            _ => ascending
                ? "fp.CreatedAt ASC, fp.PostID ASC"
                : "fp.CreatedAt DESC, fp.PostID DESC"
        };
    }

    private static List<string> ParseCsvImageUrls(string csv)
    {
        if (string.IsNullOrWhiteSpace(csv))
        {
            return new List<string>();
        }

        var uniqueImages = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (string value in csv.Split(',', StringSplitOptions.RemoveEmptyEntries))
        {
            string normalized = value.Trim();
            if (!string.IsNullOrWhiteSpace(normalized))
            {
                uniqueImages.Add(normalized);
            }
        }

        return new List<string>(uniqueImages);
    }

    private static string BuildPrefixPattern(string rawValue)
    {
        string normalized = rawValue.Trim().ToUpperInvariant();
        return $"{EscapeSqlLikePattern(normalized)}%";
    }

    private static string EscapeSqlLikePattern(string value)
    {
        return value
            .Replace("\\", "\\\\", StringComparison.Ordinal)
            .Replace("%", "\\%", StringComparison.Ordinal)
            .Replace("_", "\\_", StringComparison.Ordinal)
            .Replace("[", "\\[", StringComparison.Ordinal);
    }
}
