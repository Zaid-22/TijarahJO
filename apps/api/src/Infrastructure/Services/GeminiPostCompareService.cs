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

public sealed class GeminiPostCompareService(
    DatabaseConnectionString dbConn,
    ICacheService cache,
    HttpClient httpClient,
    IOptions<GeminiSettings> settings,
    ILogger<GeminiPostCompareService> logger) : IPostCompareService
{
    private readonly DatabaseConnectionString _dbConn = dbConn;
    private readonly ICacheService _cache = cache;
    private readonly HttpClient _httpClient = httpClient;
    private readonly GeminiSettings _settings = settings.Value;
    private readonly ILogger<GeminiPostCompareService> _logger = logger;

    private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(1);
    private const string CacheKeyPrefix = "post_compare:";

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

    public async Task<PostCompareResult> CompareAsync(
        List<int> postIds,
        string language = "en",
        CancellationToken cancellationToken = default)
    {
        if (postIds is not { Count: >= 2 and <= 3 })
        {
            return new PostCompareResult
            {
                Success = false,
                FailureReason = CompareFailureReason.InvalidRequest,
                Message = "Please provide 2 or 3 post IDs for comparison."
            };
        }

        var distinctIds = postIds.Distinct().ToList();
        if (distinctIds.Count < 2)
        {
            return new PostCompareResult
            {
                Success = false,
                FailureReason = CompareFailureReason.InvalidRequest,
                Message = "Post IDs must be unique."
            };
        }

        // --- Check cache ---
        string cacheKey = BuildCacheKey(distinctIds, language);
        var cached = await _cache.GetAsync<PostCompareResult>(cacheKey, cancellationToken);
        if (cached != null)
        {
            if (_logger.IsEnabled(LogLevel.Information))
                _logger.LogInformation("Returning cached comparison for key {CacheKey}", cacheKey);
            return cached;
        }

        // --- Fetch posts from database ---
        List<PostForComparison> posts;
        try
        {
            posts = await FetchPostsAsync(distinctIds, cancellationToken);
        }
        catch (Exception ex)
        {
            if (_logger.IsEnabled(LogLevel.Error))
                _logger.LogError(ex, "Failed to fetch posts for comparison: {Ids}", string.Join(",", distinctIds));
            
            return new PostCompareResult
            {
                Success = false,
                FailureReason = CompareFailureReason.InternalError,
                Message = "Failed to fetch post data."
            };
        }

        if (posts.Count != distinctIds.Count)
        {
            var foundIds = posts.Select(p => p.PostId).ToHashSet();
            var missing = distinctIds.Where(id => !foundIds.Contains(id)).ToList();
            return new PostCompareResult
            {
                Success = false,
                FailureReason = CompareFailureReason.PostNotFound,
                Message = $"Posts not found: {string.Join(", ", missing)}"
            };
        }

        // --- Call Gemini AI ---
        PostCompareResult result;
        try
        {
            result = await CallGeminiAsync(posts, language, cancellationToken);
        }
        catch (Exception ex)
        {
            if (_logger.IsEnabled(LogLevel.Error))
                _logger.LogError(ex, "Gemini AI call failed for posts: {Ids}", string.Join(",", distinctIds));
            
            return new PostCompareResult
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

    private async Task<List<PostForComparison>> FetchPostsAsync(
        List<int> postIds,
        CancellationToken cancellationToken)
    {
        var posts = new List<PostForComparison>();

        // Build parameterised IN clause
        var paramNames = postIds.Select((_, i) => $"@id{i}").ToList();
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
        for (int i = 0; i < postIds.Count; i++)
        {
            command.Parameters.AddWithValue(paramNames[i], postIds[i]);
        }

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            posts.Add(new PostForComparison
            {
                PostId = reader.GetInt32(reader.GetOrdinal("PostID")),
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

        return posts;
    }

    // -----------------------------------------------------------------------
    // Gemini AI call
    // -----------------------------------------------------------------------

    private const int MaxRetriesPerModel = 2;
    private const int MaxLoggedErrorBodyChars = 500;
    private static readonly TimeSpan BaseRetryDelay = TimeSpan.FromSeconds(1);

    private static bool IsTransientStatusCode(System.Net.HttpStatusCode statusCode) =>
        statusCode is System.Net.HttpStatusCode.TooManyRequests          // 429
            or System.Net.HttpStatusCode.InternalServerError             // 500
            or System.Net.HttpStatusCode.ServiceUnavailable;             // 503

    private static string FriendlyErrorMessage(System.Net.HttpStatusCode statusCode, string? googleMessage) =>
        statusCode switch
        {
            System.Net.HttpStatusCode.TooManyRequests =>
                "The AI service is currently at capacity. Please wait a moment and try again.",
            System.Net.HttpStatusCode.ServiceUnavailable =>
                "Google's AI servers are temporarily overloaded. Please try again shortly.",
            System.Net.HttpStatusCode.InternalServerError =>
                "The AI service encountered an internal error. Please try again.",
            _ => googleMessage ?? "An unexpected error occurred while communicating with the AI service."
        };

    private static string BuildGeminiEndpoint(string modelName)
        => $"https://generativelanguage.googleapis.com/v1beta/models/{Uri.EscapeDataString(modelName)}:generateContent";

    private static string SanitizeErrorBodyForLog(string? body)
    {
        if (string.IsNullOrWhiteSpace(body))
        {
            return "";
        }

        string trimmed = body.Trim();
        return trimmed.Length <= MaxLoggedErrorBodyChars
            ? trimmed
            : $"{trimmed[..MaxLoggedErrorBodyChars]}...";
    }

    private async Task<PostCompareResult> CallGeminiAsync(
        List<PostForComparison> posts,
        string language,
        CancellationToken cancellationToken)
    {
        string prompt = BuildPrompt(posts, language);


        // Build the list of models to try: primary first, then fallback if configured
        var modelsToTry = new List<string> { _settings.ModelName };
        if (!string.IsNullOrWhiteSpace(_settings.FallbackModelName) &&
            !string.Equals(_settings.FallbackModelName, _settings.ModelName, StringComparison.OrdinalIgnoreCase))
        {
            modelsToTry.Add(_settings.FallbackModelName);
        }

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

        HttpResponseMessage? lastResponse = null;
        string? lastErrorBody = null;

        foreach (string modelName in modelsToTry)
        {
            string url = BuildGeminiEndpoint(modelName);

            if (_logger.IsEnabled(LogLevel.Information))
                _logger.LogInformation("Calling Gemini API with model {Model}, key present: {KeyPresent}",
                    modelName, !string.IsNullOrWhiteSpace(_settings.ApiKey));

            for (int attempt = 1; attempt <= MaxRetriesPerModel; attempt++)
            {
                using var requestMessage = new HttpRequestMessage(HttpMethod.Post, url)
                {
                    Content = JsonContent.Create(requestBody, options: s_camelCaseOptions)
                };
                if (!string.IsNullOrWhiteSpace(_settings.ApiKey))
                {
                    requestMessage.Headers.TryAddWithoutValidation("x-goog-api-key", _settings.ApiKey);
                }

                var response = await _httpClient.SendAsync(requestMessage, cancellationToken);

                if (response.IsSuccessStatusCode)
                {
                    if (modelName != _settings.ModelName && _logger.IsEnabled(LogLevel.Information))
                        _logger.LogInformation("Successfully used fallback model {Model}", modelName);

                    string responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
                    return ParseGeminiResponse(posts, responseJson);
                }

                lastResponse = response;
                lastErrorBody = await response.Content.ReadAsStringAsync(cancellationToken);

                // Non-transient error — don't retry, don't try fallback
                if (!IsTransientStatusCode(response.StatusCode))
                {
                    _logger.LogError("Gemini API ({Model}) returned non-transient {StatusCode}: {BodyPreview}",
                        modelName, response.StatusCode, SanitizeErrorBodyForLog(lastErrorBody));
                    goto BuildErrorResult;
                }

                // Last attempt for this model — skip delay, move to next model
                if (attempt == MaxRetriesPerModel)
                {
                    if (_logger.IsEnabled(LogLevel.Warning))
                    {
                        string action = modelName != modelsToTry[^1] ? "Switching to fallback model..." : "All models exhausted.";
                        _logger.LogWarning(
                            "Gemini model {Model} exhausted {MaxRetries} retries. {Action}",
                            modelName, MaxRetriesPerModel, action);
                    }
                    break;
                }

                // Exponential backoff: 1s, 2s
                var delay = BaseRetryDelay * (1 << (attempt - 1));
                _logger.LogWarning(
                    "Gemini API ({Model}) returned {StatusCode} on attempt {Attempt}/{MaxRetries}. Retrying in {Delay}ms...",
                    modelName, response.StatusCode, attempt, MaxRetriesPerModel, delay.TotalMilliseconds);

                await Task.Delay(delay, cancellationToken);
            }
        }

        BuildErrorResult:
        // --- All models and retries exhausted, or non-transient error ---
        string cleanMessage = "An unexpected error occurred while communicating with the AI service.";
        try
        {
            using var jsonDoc = JsonDocument.Parse(lastErrorBody!);
            if (jsonDoc.RootElement.TryGetProperty("error", out var errorElement) &&
                errorElement.TryGetProperty("message", out var messageElement))
            {
                cleanMessage = messageElement.GetString() ?? cleanMessage;
            }
        }
        catch { /* Ignore parsing errors and use fallback */ }

        var finalStatusCode = lastResponse!.StatusCode;
        if (IsTransientStatusCode(finalStatusCode))
        {
            cleanMessage = FriendlyErrorMessage(finalStatusCode, cleanMessage);
        }

        var failureReason = finalStatusCode == System.Net.HttpStatusCode.TooManyRequests
            ? CompareFailureReason.RateLimited
            : CompareFailureReason.AiServiceError;

        _logger.LogError("Gemini API failed after trying {ModelCount} model(s). Last status: {StatusCode}, BodyPreview: {BodyPreview}",
            modelsToTry.Count, finalStatusCode, SanitizeErrorBodyForLog(lastErrorBody));

        return new PostCompareResult
        {
            Success = false,
            FailureReason = failureReason,
            Message = cleanMessage
        };
    }

    private static string BuildPrompt(List<PostForComparison> posts, string language)
    {
        var postsJson = JsonSerializer.Serialize(posts.Select(p => new
        {
            p.Name,
            p.Price,
            p.Category,
            p.Description,
            p.City,
            p.Views
        }), s_indentedOptions);

        return $@"You are a post comparison expert for an online marketplace.

Compare the following posts:
{postsJson}

Return a JSON object with this EXACT structure (no markdown, no code fences, just pure JSON).
IMPORTANT: When formatting prices, ALWAYS use the 'JOD' suffix (e.g., 150 JOD). NEVER prepend the '$' symbol or use USD.

{{
  ""postSummaries"": [
    {{
      ""postName"": ""Post Name"",
      ""summary"": ""A 2-3 sentence overview of this post: what it is, who it's for, and its standout quality.""
    }}
  ],
  ""priceComparison"": ""A brief 1-2 sentence price comparison"",
  ""featureDifferences"": [
    {{
      ""postName"": ""Post Name"",
      ""features"": [""feature 1"", ""feature 2"", ""feature 3""]
    }}
  ],
  ""prosCons"": [
    {{
      ""postName"": ""Post Name"",
      ""pros"": [""pro 1"", ""pro 2"", ""pro 3""],
      ""cons"": [""con 1"", ""con 2""]
    }}
  ],
  ""bestFor"": {{
    ""budget"": ""Name of the best post for budget and why"",
    ""performance"": ""Name of the best post for performance and why"",
    ""dailyUse"": ""Name of the best post for daily use and why""
  }},
  ""finalRecommendation"": {{
    ""winnerName"": ""Exact post name of the winner"",
    ""bestFor"": ""One short phrase: e.g. Daily use, Budget pick, Best overall"",
    ""reason"": ""One short sentence why this post wins""
  }}
}}

Important:
- Be extremely specific and helpful.
- Reference actual post names and prices.
- Each post must have its own entry in postSummaries, featureDifferences, and prosCons.
- **Post Summaries**: 2-3 sentences per post. Describe what the post is, its key selling points, and who would benefit from it.
- **Price Comparison**: Keep this extremely brief. Max 1-2 short sentences focused on the price gap.
- **Pros/Cons**: Include pricing advantages/disadvantages here (e.g., 'Best price in category' as a pro, or 'Most expensive option' as a con).
- **Best Choice For reasoning**: Provide 2 detailed sentences of reasoning for each category.
- **Final Recommendation**: winnerName MUST exactly match one of the post names. bestFor is a short category phrase. reason is ONE sentence max.
- **STRICT LIMIT: Bullet points (pros, cons, features arrays only) MUST be 5 words or less.** Eliminate filler words.

**IMPORTANT REGARDING LANGUAGE**:
You MUST provide all text values, summaries, bullet points, reasons, and paragraphs in the following language: {(language.StartsWith("ar", StringComparison.OrdinalIgnoreCase) ? "Arabic" : "English")}. The keys of the JSON MUST remain in English as requested above.";
    }

    private PostCompareResult ParseGeminiResponse(
        List<PostForComparison> posts,
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

            return new PostCompareResult
            {
                Success = true,
                Posts = posts,
                PriceComparison = parsed.PriceComparison ?? "",
                PostSummaries = parsed.PostSummaries?.Select(ps => new PostSummary
                {
                    PostName = ps.PostName ?? "",
                    Summary = ps.Summary ?? ""
                }).ToList() ?? [],
                FeatureDifferences = parsed.FeatureDifferences?.Select(fd => new PostFeatures
                {
                    PostName = fd.PostName ?? "",
                    Features = fd.Features ?? []
                }).ToList() ?? [],
                ProsCons = parsed.ProsCons?.Select(pc => new PostProsCons
                {
                    PostName = pc.PostName ?? "",
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
                FinalRecommendation = parsed.FinalRecommendation != null
                    ? new FinalRecommendationResult
                    {
                        WinnerName = parsed.FinalRecommendation.WinnerName ?? "",
                        BestFor = parsed.FinalRecommendation.BestFor ?? "",
                        Reason = parsed.FinalRecommendation.Reason ?? ""
                    }
                    : null
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to parse Gemini AI response");
            return FailedAiResult("Failed to process AI comparison results.");
        }
    }

    private static PostCompareResult FailedAiResult(string message) => new()
    {
        Success = false,
        FailureReason = CompareFailureReason.AiServiceError,
        Message = message
    };

    private static string BuildCacheKey(List<int> ids, string language)
    {
        var sorted = ids.OrderBy(x => x).ToList();
        return $"{CacheKeyPrefix}{language.ToLower()}_{string.Join("_", sorted)}";
    }

    // -----------------------------------------------------------------------
    // Internal DTOs for Gemini JSON parsing
    // -----------------------------------------------------------------------

    private sealed class GeminiCompareOutput
    {
        public List<GeminiPostSummary>? PostSummaries { get; set; }
        public string? PriceComparison { get; set; }
        public List<GeminiFeatureDifferences>? FeatureDifferences { get; set; }
        public List<GeminiProsCons>? ProsCons { get; set; }
        public GeminiBestFor? BestFor { get; set; }
        public GeminiFinalRecommendation? FinalRecommendation { get; set; }
    }

    private sealed class GeminiFinalRecommendation
    {
        public string? WinnerName { get; set; }
        public string? BestFor { get; set; }
        public string? Reason { get; set; }
    }

    private sealed class GeminiPostSummary
    {
        public string? PostName { get; set; }
        public string? Summary { get; set; }
    }

    private sealed class GeminiFeatureDifferences
    {
        public string? PostName { get; set; }
        public List<string>? Features { get; set; }
    }

    private sealed class GeminiProsCons
    {
        public string? PostName { get; set; }
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
