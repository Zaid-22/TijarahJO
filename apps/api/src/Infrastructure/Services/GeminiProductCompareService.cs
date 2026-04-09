using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Infrastructure.DataAccess;

namespace TijarahJo.Infrastructure.Services;

public sealed class GeminiProductCompareService(
    DatabaseConnectionString dbConn,
    ICacheService cache,
    HttpClient httpClient,
    IOptions<GeminiSettings> settings,
    ILogger<GeminiProductCompareService> logger) : IProductCompareService
{
    private readonly DatabaseConnectionString _dbConn = dbConn;
    private readonly ICacheService _cache = cache;
    private readonly HttpClient _httpClient = httpClient;
    private readonly GeminiSettings _settings = settings.Value;
    private readonly ILogger<GeminiProductCompareService> _logger = logger;

    private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(1);
    private const string CacheKeyPrefix = "product_compare:";

    private static readonly JsonSerializerOptions s_camelCaseOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private static readonly JsonSerializerOptions s_caseInsensitiveOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private static readonly JsonSerializerOptions s_indentedOptions = new()
    {
        WriteIndented = true
    };

    public async Task<ProductCompareResult> CompareAsync(
        List<int> productIds,
        CancellationToken cancellationToken = default)
    {
        if (productIds is not { Count: >= 2 and <= 3 })
        {
            return new ProductCompareResult
            {
                Success = false,
                FailureReason = CompareFailureReason.InvalidRequest,
                Message = "Please provide 2 or 3 product IDs for comparison."
            };
        }

        var distinctIds = productIds.Distinct().ToList();
        if (distinctIds.Count < 2)
        {
            return new ProductCompareResult
            {
                Success = false,
                FailureReason = CompareFailureReason.InvalidRequest,
                Message = "Product IDs must be unique."
            };
        }

        // --- Check cache ---
        string cacheKey = BuildCacheKey(distinctIds);
        var cached = await _cache.GetAsync<ProductCompareResult>(cacheKey, cancellationToken);
        if (cached != null)
        {
            if (_logger.IsEnabled(LogLevel.Information))
                _logger.LogInformation("Returning cached comparison for key {CacheKey}", cacheKey);
            return cached;
        }

        // --- Fetch products from database ---
        List<ProductForComparison> products;
        try
        {
            products = await FetchProductsAsync(distinctIds, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch products for comparison: {Ids}", string.Join(",", distinctIds));
            return new ProductCompareResult
            {
                Success = false,
                FailureReason = CompareFailureReason.InternalError,
                Message = "Failed to fetch product data."
            };
        }

        if (products.Count != distinctIds.Count)
        {
            var foundIds = products.Select(p => p.ProductId).ToHashSet();
            var missing = distinctIds.Where(id => !foundIds.Contains(id)).ToList();
            return new ProductCompareResult
            {
                Success = false,
                FailureReason = CompareFailureReason.ProductNotFound,
                Message = $"Products not found: {string.Join(", ", missing)}"
            };
        }

        // --- Call Gemini AI ---
        ProductCompareResult result;
        try
        {
            result = await CallGeminiAsync(products, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Gemini AI call failed for products: {Ids}", string.Join(",", distinctIds));
            return new ProductCompareResult
            {
                Success = false,
                FailureReason = CompareFailureReason.AiServiceError,
                Message = $"AI service error: {ex.Message}"
            };
        }

        // --- Cache successful result ---
        if (result.Success)
        {
            try
            {
                await _cache.SetAsync(cacheKey, result, CacheDuration, cancellationToken: cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to cache comparison result for key {CacheKey}", cacheKey);
                // Non-fatal — continue returning the result
            }
        }

        return result;
    }

    // -----------------------------------------------------------------------
    // Database fetch
    // -----------------------------------------------------------------------

    private async Task<List<ProductForComparison>> FetchProductsAsync(
        List<int> productIds,
        CancellationToken cancellationToken)
    {
        var products = new List<ProductForComparison>();

        // Build parameterised IN clause
        var paramNames = productIds.Select((_, i) => $"@id{i}").ToList();
        string inClause = string.Join(", ", paramNames);

        string sql = $@"
            SELECT
                p.PostID,
                p.PostTitle,
                ISNULL(p.Price, 0) AS Price,
                ISNULL(p.PostDescription, '') AS PostDescription,
                ISNULL(c.CategoryName, '') AS CategoryName,
                ISNULL(ci.CityName, '') AS CityName,
                p.Views,
                (SELECT TOP 1 pi.PostImageUrl
                 FROM PostImages pi
                 WHERE pi.PostID = p.PostID
                 ORDER BY pi.PostImageID) AS ImageUrl
            FROM Posts p
            LEFT JOIN Categories c ON c.CategoryID = p.CategoryID
            LEFT JOIN Cities ci ON ci.CityID = p.CityID
            WHERE p.PostID IN ({inClause})
              AND p.IsDeleted = 0;";

        await using var connection = new SqlConnection(_dbConn.Value);
        await connection.OpenAsync(cancellationToken);

        await using var command = connection.CreateCommand();
        command.CommandText = sql;
        for (int i = 0; i < productIds.Count; i++)
        {
            command.Parameters.AddWithValue(paramNames[i], productIds[i]);
        }

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            products.Add(new ProductForComparison
            {
                ProductId = reader.GetInt32(reader.GetOrdinal("PostID")),
                Name = reader.GetString(reader.GetOrdinal("PostTitle")),
                Price = reader.GetDecimal(reader.GetOrdinal("Price")),
                Description = reader.GetString(reader.GetOrdinal("PostDescription")),
                Category = reader.GetString(reader.GetOrdinal("CategoryName")),
                City = reader.GetString(reader.GetOrdinal("CityName")),
                Views = reader.GetInt64(reader.GetOrdinal("Views")),
                ImageUrl = reader.IsDBNull(reader.GetOrdinal("ImageUrl"))
                    ? null
                    : reader.GetString(reader.GetOrdinal("ImageUrl"))
            });
        }

        return products;
    }

    // -----------------------------------------------------------------------
    // Gemini AI call
    // -----------------------------------------------------------------------

    private async Task<ProductCompareResult> CallGeminiAsync(
        List<ProductForComparison> products,
        CancellationToken cancellationToken)
    {
        string prompt = BuildPrompt(products);
        string url = $"https://generativelanguage.googleapis.com/v1beta/models/{_settings.ModelName}:generateContent?key={_settings.ApiKey}";

        var requestBody = new
        {
            contents = new[]
            {
                new { parts = new[] { new { text = prompt } } }
            },
            generationConfig = new
            {
                temperature = 0.7,
                maxOutputTokens = 4096,
                responseMimeType = "application/json"
            }
        };

        if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation("Calling Gemini API with model {Model}, key present: {KeyPresent}",
                _settings.ModelName, !string.IsNullOrWhiteSpace(_settings.ApiKey));

        var response = await _httpClient.PostAsJsonAsync(url, requestBody, s_camelCaseOptions, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            string errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
            string cleanMessage = "An unexpected error occurred while communicating with the AI service.";
            try
            {
                using var jsonDoc = JsonDocument.Parse(errorBody);
                if (jsonDoc.RootElement.TryGetProperty("error", out var errorElement) &&
                    errorElement.TryGetProperty("message", out var messageElement))
                {
                    cleanMessage = messageElement.GetString() ?? cleanMessage;
                }
            }
            catch { /* Ignore parsing errors and use fallback */ }

            _logger.LogError("Gemini API returned {StatusCode}: {Body}", response.StatusCode, errorBody);
            return new ProductCompareResult
            {
                Success = false,
                FailureReason = CompareFailureReason.AiServiceError,
                Message = cleanMessage
            };
        }

        string responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
        return ParseGeminiResponse(products, responseJson);
    }

    private static string BuildPrompt(List<ProductForComparison> products)
    {
        var productsJson = JsonSerializer.Serialize(products.Select(p => new
        {
            p.Name,
            p.Price,
            p.Category,
            p.Description,
            p.City,
            p.Views
        }), s_indentedOptions);

        return $@"You are a product comparison expert for an online marketplace.

Compare the following products:
{productsJson}

Return a JSON object with this EXACT structure (no markdown, no code fences, just pure JSON). 
IMPORTANT: When formatting prices, ALWAYS use the 'JOD' suffix (e.g., 150 JOD). NEVER prepend the '$' symbol or use USD.

{{
  ""priceComparison"": ""A detailed price comparison paragraph"",
  ""featureDifferences"": [
    {{
      ""productName"": ""Product Name"",
      ""features"": [""feature 1"", ""feature 2"", ""feature 3""]
    }}
  ],
  ""prosCons"": [
    {{
      ""productName"": ""Product Name"",
      ""pros"": [""pro 1"", ""pro 2"", ""pro 3""],
      ""cons"": [""con 1"", ""con 2""]
    }}
  ],
  ""bestFor"": {{
    ""budget"": ""Name of the best product for budget and why"",
    ""performance"": ""Name of the best product for performance and why"",
    ""dailyUse"": ""Name of the best product for daily use and why""
  }},
  ""finalRecommendation"": ""Your final recommendation paragraph with reasoning""
}}

Important:
- Be extremely specific and helpful.
- Reference actual product names and prices.
- Each product must have its own entry in both featureDifferences and prosCons.
- **Price Comparison**: Keep this extremely brief. Max 1-2 short sentences focused on the price gap.
- **Best Choice For reasoning**: Provide 2 detailed sentences of reasoning for each category.
- **Final Recommendation**: Max 3 concise sentences of reasoning.
- **STRICT LIMIT: Bullet points (pros, cons, features arrays only) MUST be 5 words or less.** Eliminate filler words.";
    }

    private ProductCompareResult ParseGeminiResponse(
        List<ProductForComparison> products,
        string responseJson)
    {
        try
        {
            using var doc = JsonDocument.Parse(responseJson);
            var root = doc.RootElement;

            // Navigate: candidates[0].content.parts[0].text
            if (!root.TryGetProperty("candidates", out var candidates) ||
                candidates.GetArrayLength() == 0)
            {
                _logger.LogWarning("Gemini response has no candidates");
                return FailedAiResult("No AI response generated.");
            }

            var firstCandidate = candidates[0];
            if (!firstCandidate.TryGetProperty("content", out var content) ||
                !content.TryGetProperty("parts", out var parts) ||
                parts.GetArrayLength() == 0)
            {
                _logger.LogWarning("Gemini response has no content parts");
                return FailedAiResult("AI response was empty.");
            }

            string aiText = parts[0].GetProperty("text").GetString() ?? "";

            // Clean any accidental markdown fences
            aiText = aiText.Trim();
            if (aiText.StartsWith("```json", StringComparison.OrdinalIgnoreCase))
                aiText = aiText[7..];
            if (aiText.StartsWith("```"))
                aiText = aiText[3..];
            if (aiText.EndsWith("```"))
                aiText = aiText[..^3];
            aiText = aiText.Trim();

            var parsed = JsonSerializer.Deserialize<GeminiCompareOutput>(aiText, s_caseInsensitiveOptions);
            if (parsed == null)
            {
                return FailedAiResult("Failed to parse AI response.");
            }

            return new ProductCompareResult
            {
                Success = true,
                Products = products,
                PriceComparison = parsed.PriceComparison ?? "",
                FeatureDifferences = parsed.FeatureDifferences?.Select(fd => new ProductFeatures
                {
                    ProductName = fd.ProductName ?? "",
                    Features = fd.Features ?? []
                }).ToList() ?? [],
                ProsCons = parsed.ProsCons?.Select(pc => new ProductProsCons
                {
                    ProductName = pc.ProductName ?? "",
                    Pros = pc.Pros ?? [],
                    Cons = pc.Cons ?? []
                }).ToList() ?? [],
                BestFor = parsed.BestFor != null
                    ? new BestForRecommendation
                    {
                        Budget = parsed.BestFor.Budget ?? "",
                        Performance = parsed.BestFor.Performance ?? "",
                        DailyUse = parsed.BestFor.DailyUse ?? ""
                    }
                    : null,
                FinalRecommendation = parsed.FinalRecommendation ?? ""
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to parse Gemini AI response");
            return FailedAiResult("Failed to process AI comparison results.");
        }
    }

    private static ProductCompareResult FailedAiResult(string message) => new()
    {
        Success = false,
        FailureReason = CompareFailureReason.AiServiceError,
        Message = message
    };

    private static string BuildCacheKey(List<int> ids)
    {
        var sorted = ids.OrderBy(x => x).ToList();
        return CacheKeyPrefix + string.Join("_", sorted);
    }

    // -----------------------------------------------------------------------
    // Internal DTOs for Gemini JSON parsing
    // -----------------------------------------------------------------------

    private sealed class GeminiCompareOutput
    {
        public string? PriceComparison { get; set; }
        public List<GeminiFeatureDifferences>? FeatureDifferences { get; set; }
        public List<GeminiProsCons>? ProsCons { get; set; }
        public GeminiBestFor? BestFor { get; set; }
        public string? FinalRecommendation { get; set; }
    }

    private sealed class GeminiFeatureDifferences
    {
        public string? ProductName { get; set; }
        public List<string>? Features { get; set; }
    }

    private sealed class GeminiProsCons
    {
        public string? ProductName { get; set; }
        public List<string>? Pros { get; set; }
        public List<string>? Cons { get; set; }
    }

    private sealed class GeminiBestFor
    {
        public string? Budget { get; set; }
        public string? Performance { get; set; }
        public string? DailyUse { get; set; }
    }
}
