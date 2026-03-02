using Microsoft.Data.SqlClient;
using System.Collections.Concurrent;
using System.Data;
using System.Text;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.Application.Common;
using TijarahJoDB_DataAccess;

namespace TijarahJoDB.DAL.Queries;

public sealed class PostListingQueryService : IPostListingQueryService
{
    private const char ImageSeparator = '\u001F';
    private const int MaxPageSize = 200;
    private static readonly ConcurrentDictionary<string, bool> FullTextCapabilityCache = new(StringComparer.OrdinalIgnoreCase);

    public async Task<PostListingPageResult> QueryAsync(PostListingQuery query, CancellationToken cancellationToken = default)
    {
        int page = query.Page < 1 ? 1 : query.Page;
        int limit = query.Limit < 1 ? 20 : query.Limit;
        if (limit > MaxPageSize)
        {
            limit = MaxPageSize;
        }

        int offset = (page - 1) * limit;
        var filters = new List<string>();

        using var connection = new SqlConnection(DataAccessSettings.ConnectionString);
        using var command = connection.CreateCommand();
        await connection.OpenAsync(cancellationToken);

        bool postsFullTextAvailable = await GetCachedPostsFullTextAvailabilityAsync(connection, cancellationToken);

        AddIntParameter(command.Parameters, "@ActiveStatus", PostStatusPolicy.Active);
        AddIntParameter(command.Parameters, "@SoldStatus", PostStatusPolicy.Sold);

        if (!string.IsNullOrWhiteSpace(query.SearchTerm))
        {
            string searchPrefix = BuildPrefixPattern(query.SearchTerm);
            string? fullTextCondition = postsFullTextAvailable
                ? BuildFullTextSearchCondition(query.SearchTerm)
                : null;

            if (!string.IsNullOrWhiteSpace(fullTextCondition))
            {
                filters.Add(@"(
CONTAINS((p.PostTitle, p.PostDescription), @SearchContains) OR
c.SearchCategoryNameNormalized LIKE @SearchPrefix ESCAPE '\' OR
u.SearchFirstNameNormalized LIKE @SearchPrefix ESCAPE '\' OR
u.SearchLastNameNormalized LIKE @SearchPrefix ESCAPE '\' OR
u.SearchFullNameNormalized LIKE @SearchPrefix ESCAPE '\' OR
ct.CityName LIKE @SearchPrefix ESCAPE '\' OR
a.AreaName LIKE @SearchPrefix ESCAPE '\'
)");
                AddNVarCharParameter(command.Parameters, "@SearchContains", 4000, fullTextCondition);
                AddNVarCharParameter(command.Parameters, "@SearchPrefix", 450, searchPrefix);
            }
            else
            {
                filters.Add(@"(
p.SearchTitleNormalized LIKE @SearchPrefix ESCAPE '\' OR
p.SearchDescriptionPrefixNormalized LIKE @SearchPrefix ESCAPE '\' OR
c.SearchCategoryNameNormalized LIKE @SearchPrefix ESCAPE '\' OR
u.SearchFirstNameNormalized LIKE @SearchPrefix ESCAPE '\' OR
u.SearchLastNameNormalized LIKE @SearchPrefix ESCAPE '\' OR
u.SearchFullNameNormalized LIKE @SearchPrefix ESCAPE '\' OR
ct.CityName LIKE @SearchPrefix ESCAPE '\' OR
a.AreaName LIKE @SearchPrefix ESCAPE '\'
)");
                AddNVarCharParameter(command.Parameters, "@SearchPrefix", 450, searchPrefix);
            }
        }

        if (query.CategoryId.HasValue && query.CategoryId.Value > 0)
        {
            filters.Add("p.CategoryID = @CategoryID");
            AddIntParameter(command.Parameters, "@CategoryID", query.CategoryId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(query.CategoryNameLike))
        {
            filters.Add("c.SearchCategoryNameNormalized LIKE @CategoryPrefix ESCAPE '\\'");
            AddNVarCharParameter(command.Parameters, "@CategoryPrefix", 100, BuildPrefixPattern(query.CategoryNameLike));
        }

        if (!string.IsNullOrWhiteSpace(query.CityLike))
        {
            filters.Add("ct.CityName LIKE @CityPrefix ESCAPE '\\'");
            AddNVarCharParameter(command.Parameters, "@CityPrefix", 100, BuildPrefixPattern(query.CityLike));
        }

        if (query.MinPrice.HasValue)
        {
            filters.Add("p.Price >= @MinPrice");
            AddDecimalParameter(command.Parameters, "@MinPrice", query.MinPrice.Value);
        }

        if (query.MaxPrice.HasValue)
        {
            filters.Add("p.Price <= @MaxPrice");
            AddDecimalParameter(command.Parameters, "@MaxPrice", query.MaxPrice.Value);
        }

        if (query.UserId.HasValue && query.UserId.Value > 0)
        {
            filters.Add("p.UserID = @UserID");
            AddIntParameter(command.Parameters, "@UserID", query.UserId.Value);
        }

        switch (query.Visibility)
        {
            case PostListingVisibilityMode.All:
                filters.Add("1 = 1");
                break;
            case PostListingVisibilityMode.NonDeletedAnyStatus:
                filters.Add("p.IsDeleted = 0");
                break;
            case PostListingVisibilityMode.ActiveOnly:
                filters.Add("p.IsDeleted = 0 AND p.Status = @ActiveStatus");
                break;
            case PostListingVisibilityMode.SoldOnly:
                filters.Add("p.IsDeleted = 0 AND p.Status = @SoldStatus");
                break;
            case PostListingVisibilityMode.DeletedOnly:
                filters.Add("p.IsDeleted = 1");
                break;
            default:
                filters.Add("p.IsDeleted = 0 AND p.Status IN (@ActiveStatus, @SoldStatus)");
                break;
        }

        string orderByClause = BuildOrderByClause(query.SortField, query.SortAscending);

        AddIntParameter(command.Parameters, "@Offset", offset);
        AddIntParameter(command.Parameters, "@Limit", limit);

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
        ISNULL(ct.CityName, '') AS City,
        ISNULL(a.AreaName, '') AS Area,
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
    FROM dbo.Posts AS p
    LEFT JOIN dbo.Categories AS c ON c.CategoryID = p.CategoryID
    LEFT JOIN dbo.Users AS u ON u.UserID = p.UserID
    LEFT JOIN dbo.Cities AS ct ON ct.CityID = p.CityID
    LEFT JOIN dbo.Areas AS a ON a.AreaID = p.AreaID
    OUTER APPLY
    (
        SELECT STRING_AGG(pi.PostImageURL, NCHAR(31))
               WITHIN GROUP (ORDER BY pi.UploadedAt, pi.PostImageID) AS ImageURLs
        FROM dbo.PostImages AS pi
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

        var posts = new List<PostListingRow>();
        int totalPosts = 0;

        using SqlDataReader reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
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
                Views = reader.GetInt64(reader.GetOrdinal("Views")),
                ClientStatus = reader.GetString(reader.GetOrdinal("ClientStatus")),
                Images = ParseAggregatedImageUrls(imageCsv)
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

    private static void AddIntParameter(SqlParameterCollection parameters, string name, int value)
    {
        parameters.Add(new SqlParameter(name, SqlDbType.Int) { Value = value });
    }

    private static void AddDecimalParameter(SqlParameterCollection parameters, string name, decimal value)
    {
        parameters.Add(new SqlParameter(name, SqlDbType.Decimal)
        {
            Precision = 18,
            Scale = 2,
            Value = value
        });
    }

    private static void AddNVarCharParameter(SqlParameterCollection parameters, string name, int size, string value)
    {
        parameters.Add(new SqlParameter(name, SqlDbType.NVarChar, size) { Value = value });
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

    private static List<string> ParseAggregatedImageUrls(string imagePayload)
    {
        if (string.IsNullOrWhiteSpace(imagePayload))
        {
            return new List<string>();
        }

        string[] parsedSegments = imagePayload.Contains(ImageSeparator)
            ? imagePayload.Split(ImageSeparator, StringSplitOptions.RemoveEmptyEntries)
            : ParseLegacyCommaDelimitedImages(imagePayload);

        var orderedUniqueImages = new List<string>(parsedSegments.Length);
        var seenImages = new HashSet<string>(StringComparer.Ordinal);
        foreach (string value in parsedSegments)
        {
            string normalized = value.Trim();
            if (string.IsNullOrWhiteSpace(normalized))
            {
                continue;
            }

            if (!seenImages.Add(normalized))
            {
                continue;
            }

            orderedUniqueImages.Add(normalized);
        }

        return orderedUniqueImages;
    }

    private static string[] ParseLegacyCommaDelimitedImages(string imagePayload)
    {
        string[] rawSegments = imagePayload.Split(',', StringSplitOptions.RemoveEmptyEntries);
        if (rawSegments.Length == 0)
        {
            return Array.Empty<string>();
        }

        var mergedSegments = new List<string>(rawSegments.Length);
        for (int i = 0; i < rawSegments.Length; i++)
        {
            string current = rawSegments[i].Trim();
            if (string.IsNullOrWhiteSpace(current))
            {
                continue;
            }

            bool looksLikeSplitDataPrefix =
                current.StartsWith("data:", StringComparison.OrdinalIgnoreCase) &&
                current.Contains(";base64", StringComparison.OrdinalIgnoreCase) &&
                !current.Contains(',');

            if (looksLikeSplitDataPrefix && i + 1 < rawSegments.Length)
            {
                string payload = rawSegments[i + 1].Trim();
                if (!string.IsNullOrWhiteSpace(payload) &&
                    !payload.StartsWith("http://", StringComparison.OrdinalIgnoreCase) &&
                    !payload.StartsWith("https://", StringComparison.OrdinalIgnoreCase) &&
                    !payload.StartsWith("data:", StringComparison.OrdinalIgnoreCase) &&
                    !payload.StartsWith("blob:", StringComparison.OrdinalIgnoreCase))
                {
                    mergedSegments.Add($"{current},{payload}");
                    i += 1;
                    continue;
                }
            }

            mergedSegments.Add(current);
        }

        return mergedSegments.ToArray();
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

    private static async Task<bool> GetCachedPostsFullTextAvailabilityAsync(SqlConnection connection, CancellationToken cancellationToken)
    {
        string cacheKey = $"{connection.DataSource}|{connection.Database}";
        if (FullTextCapabilityCache.TryGetValue(cacheKey, out bool cachedCapability))
        {
            return cachedCapability;
        }

        bool detectedCapability = await HasPostsFullTextIndexAsync(connection, cancellationToken);
        FullTextCapabilityCache.TryAdd(cacheKey, detectedCapability);
        return detectedCapability;
    }

    private static async Task<bool> HasPostsFullTextIndexAsync(SqlConnection connection, CancellationToken cancellationToken)
    {
        using var command = connection.CreateCommand();
        command.CommandText = @"
SELECT CASE
           WHEN CAST(ISNULL(SERVERPROPERTY('IsFullTextInstalled'), 0) AS INT) = 1
                AND EXISTS (
                    SELECT 1
                    FROM sys.fulltext_indexes
                    WHERE object_id = OBJECT_ID(N'dbo.Posts')
                )
           THEN 1
           ELSE 0
       END;";

        object? scalar = await command.ExecuteScalarAsync(cancellationToken);
        return scalar != null && Convert.ToInt32(scalar) == 1;
    }

    private static string? BuildFullTextSearchCondition(string rawValue)
    {
        var seen = new HashSet<string>(StringComparer.Ordinal);
        var tokens = new List<string>();

        foreach (string part in rawValue.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            string sanitized = SanitizeFullTextToken(part);
            if (sanitized.Length < 2 || !seen.Add(sanitized))
            {
                continue;
            }

            tokens.Add($"\"{sanitized}*\"");
            if (tokens.Count >= 8)
            {
                break;
            }
        }

        if (tokens.Count == 0)
        {
            return null;
        }

        return string.Join(" AND ", tokens);
    }

    private static string SanitizeFullTextToken(string value)
    {
        var builder = new StringBuilder(value.Length);
        foreach (char c in value)
        {
            if (char.IsLetterOrDigit(c))
            {
                builder.Append(char.ToUpperInvariant(c));
            }
        }

        return builder.ToString();
    }
}
