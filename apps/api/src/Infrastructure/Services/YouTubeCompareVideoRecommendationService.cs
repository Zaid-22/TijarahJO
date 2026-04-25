using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Infrastructure.Services;

public sealed partial class YouTubeCompareVideoRecommendationService(
    HttpClient httpClient,
    IPostReadService postReads,
    ICategoryService categories,
    ICacheService cache,
    IOptions<YouTubeSettings> settings,
    ILogger<YouTubeCompareVideoRecommendationService> logger) : ICompareVideoRecommendationService
{
    private const string CacheVersion = "v4";
    private const int MaxSearchResults = 8;
    private static readonly TimeSpan s_cacheDuration = TimeSpan.FromHours(6);

    [GeneratedRegex(@"\s+")]
    private static partial Regex WhitespaceRegex();
    private static readonly string[] s_englishSignalTerms =
    [
        " review ",
        " comparison ",
        " compare ",
        " versus ",
        " vs ",
        " unboxing ",
        " hands on ",
        " buying guide ",
        " should you buy ",
        " worth it ",
        " best ",
        " full ",
        " test ",
        " features ",
        " price ",
        " with ",
        " for ",
        " the ",
        " and ",
        " this ",
        " after "
    ];

    private static readonly string[] s_nonEnglishLanguageMarkers =
    [
        " español ",
        " espanol ",
        " análisis ",
        " analisis ",
        " reseña ",
        " resena ",
        " comparativa ",
        " opiniones ",
        " deutsch ",
        " français ",
        " francais ",
        " italiano ",
        " português ",
        " portugues ",
        " türkçe ",
        " turkce ",
        " bahasa ",
        " indonesia ",
        " hindi ",
        " urdu "
    ];

    private readonly HttpClient _httpClient = httpClient;
    private readonly IPostReadService _postReads = postReads;
    private readonly ICategoryService _categories = categories;
    private readonly ICacheService _cache = cache;
    private readonly YouTubeSettings _settings = settings.Value;
    private readonly ILogger<YouTubeCompareVideoRecommendationService> _logger = logger;

    public async Task<CompareVideoRecommendationResult> RecommendAsync(
        IReadOnlyList<int> postIds,
        string language = "en",
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.ApiKey))
        {
            return new CompareVideoRecommendationResult
            {
                Success = false,
                IsConfigured = false,
                Message = "YouTube recommendations need a YouTube Data API key."
            };
        }

        int[] distinctPostIds = [.. postIds
            .Where(postId => postId > 0)
            .Distinct()
            .OrderBy(postId => postId)
            .Take(3)];

        if (distinctPostIds.Length == 0)
        {
            return new CompareVideoRecommendationResult
            {
                Success = true,
                IsConfigured = true
            };
        }

        var normalizedLanguage = NormalizeLanguage(language);
        string cacheKey = $"compare_videos:{CacheVersion}:{normalizedLanguage}:{string.Join(",", distinctPostIds)}";
        CompareVideoRecommendationResult? cached = await _cache.GetAsync<CompareVideoRecommendationResult>(
            cacheKey,
            cancellationToken);
        if (cached != null)
        {
            return cached;
        }

        List<CompareVideoPostInput> posts = await LoadPostsAsync(distinctPostIds, cancellationToken);
        var videos = new List<CompareVideoRecommendation>();

        foreach (CompareVideoPostInput post in posts)
        {
            try
            {
                CompareVideoRecommendation? video = await RecommendForPostAsync(
                    post,
                    normalizedLanguage,
                    cancellationToken);
                if (video != null)
                {
                    videos.Add(video);
                }
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to fetch YouTube recommendation for post {PostId}", post.PostId);
            }
        }

        var result = new CompareVideoRecommendationResult
        {
            Success = true,
            IsConfigured = true,
            Videos = videos,
            Message = videos.Count == 0 ? "No matching YouTube videos were found." : null
        };

        await _cache.SetAsync(cacheKey, result, s_cacheDuration, cancellationToken: cancellationToken);
        return result;
    }

    private async Task<List<CompareVideoPostInput>> LoadPostsAsync(
        IReadOnlyList<int> postIds,
        CancellationToken cancellationToken)
    {
        var posts = new List<CompareVideoPostInput>();

        foreach (int postId in postIds)
        {
            PostReadResult result = await _postReads.GetByIdAsync(postId, cancellationToken);
            if (!result.Success || result.Post == null)
            {
                continue;
            }

            // Resolve the category name for better search queries
            string categoryName = string.Empty;
            try
            {
                var category = await _categories.FindAsync(result.Post.CategoryID, cancellationToken);
                if (category != null)
                {
                    categoryName = category.CategoryName ?? string.Empty;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to resolve category for post {PostId}", postId);
            }

            posts.Add(new CompareVideoPostInput
            {
                PostId = postId,
                Name = result.Post.PostTitle,
                Category = categoryName,
                Description = result.Post.PostDescription
            });
        }

        return posts;
    }

    private async Task<CompareVideoRecommendation?> RecommendForPostAsync(
        CompareVideoPostInput post,
        string language,
        CancellationToken cancellationToken)
    {
        foreach (string searchLanguage in GetSearchLanguages(language))
        {
            // Try the full review query first.
            string query = BuildSearchQuery(post, searchLanguage);
            CompareVideoRecommendation? video = await SearchAndPickBestAsync(post, query, searchLanguage, cancellationToken);
            if (video != null)
            {
                return video;
            }

            // Fallback: simpler query with just the product name + review.
            string fallbackQuery = BuildFallbackSearchQuery(post, searchLanguage);
            if (!string.Equals(fallbackQuery, query, StringComparison.OrdinalIgnoreCase))
            {
                video = await SearchAndPickBestAsync(post, fallbackQuery, searchLanguage, cancellationToken);
                if (video != null)
                {
                    return video;
                }
            }
        }

        return null;
    }

    private async Task<CompareVideoRecommendation?> SearchAndPickBestAsync(
        CompareVideoPostInput post,
        string query,
        string language,
        CancellationToken cancellationToken)
    {
        string searchUrl = BuildSearchUrl(query, language);
        YouTubeSearchResponse? searchResponse = await _httpClient.GetFromJsonAsync<YouTubeSearchResponse>(
            searchUrl,
            cancellationToken);

        string[] videoIds = searchResponse?.Items?
            .Select(item => item.Id?.VideoId)
            .Where(videoId => !string.IsNullOrWhiteSpace(videoId))
            .Cast<string>()
            .Distinct(StringComparer.Ordinal)
            .ToArray() ?? [];

        if (videoIds.Length == 0)
        {
            return null;
        }

        string detailsUrl = BuildVideosUrl(videoIds);
        YouTubeVideosResponse? detailsResponse = await _httpClient.GetFromJsonAsync<YouTubeVideosResponse>(
            detailsUrl,
            cancellationToken);

        return detailsResponse?.Items?
            .Where(item => item.Id != null && item.Snippet != null)
            .Select(item => ToCandidate(post, query, language, item))
            .Where(candidate => candidate != null)
            .Cast<VideoCandidate>()
            .OrderByDescending(candidate => candidate.Score)
            .Select(candidate => candidate.Video)
            .FirstOrDefault();
    }

    private static VideoCandidate? ToCandidate(
        CompareVideoPostInput post,
        string query,
        string language,
        YouTubeVideoDetailsItem item)
    {
        string title = item.Snippet?.Title?.Trim() ?? string.Empty;
        string channelTitle = item.Snippet?.ChannelTitle?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(item.Id) || string.IsNullOrWhiteSpace(title))
        {
            return null;
        }

        long viewCount = ParseLong(item.Statistics?.ViewCount);
        double score = Math.Log10(Math.Max(viewCount, 1));
        string haystack = $"{title} {item.Snippet?.Description}".ToLowerInvariant();

        // Penalize YouTube Shorts
        if (haystack.Contains("#shorts", StringComparison.OrdinalIgnoreCase)
            || haystack.Contains("#short", StringComparison.OrdinalIgnoreCase)
            || title.StartsWith('#'))
        {
            score -= 10.0;
        }

        // Boost videos that mention "review", "full review", "مراجعة" in their title
        string titleLower = title.ToLowerInvariant();
        if (titleLower.Contains("full review") || titleLower.Contains("مراجعة كاملة"))
        {
            score += 5.0;
        }
        else if (titleLower.Contains("review") || titleLower.Contains("مراجعة") || titleLower.Contains("تقييم"))
        {
            score += 3.0;
        }

        foreach (string token in ExtractSearchTokens(post.Name, post.Category))
        {
            if (haystack.Contains(token, StringComparison.OrdinalIgnoreCase))
            {
                score += 2.0;
            }
        }

        if (!IsLanguageMatch(language, item.Snippet, title))
        {
            return null;
        }

        if (language == "ar" && ContainsArabic(title))
        {
            score += 3.0;
        }
        else if (language == "en" && !ContainsArabic(title))
        {
            score += 2.0;
        }

        return new VideoCandidate(
            score,
            new CompareVideoRecommendation
            {
                PostId = post.PostId,
                VideoId = item.Id,
                Title = title,
                ChannelTitle = channelTitle,
                ThumbnailUrl = item.Snippet?.Thumbnails?.Medium?.Url
                    ?? item.Snippet?.Thumbnails?.Default?.Url
                    ?? string.Empty,
                ViewCount = viewCount,
                PublishedAt = item.Snippet?.PublishedAt ?? string.Empty,
                SearchQuery = query
            });
    }

    private string BuildSearchUrl(string query, string language)
    {
        var parameters = new Dictionary<string, string>
        {
            ["part"] = "snippet",
            ["type"] = "video",
            ["order"] = "relevance",
            ["maxResults"] = MaxSearchResults.ToString(CultureInfo.InvariantCulture),
            ["videoEmbeddable"] = "true",
            ["safeSearch"] = "moderate",
            ["relevanceLanguage"] = language,
            ["regionCode"] = language == "ar" ? "JO" : "US",
            ["q"] = query,
            ["key"] = _settings.ApiKey
        };

        return "https://www.googleapis.com/youtube/v3/search?" + BuildQueryString(parameters);
    }

    private string BuildVideosUrl(IEnumerable<string> videoIds)
    {
        var parameters = new Dictionary<string, string>
        {
            ["part"] = "snippet,statistics",
            ["id"] = string.Join(",", videoIds),
            ["key"] = _settings.ApiKey
        };

        return "https://www.googleapis.com/youtube/v3/videos?" + BuildQueryString(parameters);
    }

    private static string BuildSearchQuery(CompareVideoPostInput post, string language)
    {
        string suffix = language == "ar"
            ? "مراجعة كاملة تقييم"
            : "full review";

        // Extract a few keywords from the description to improve relevance
        string descriptionKeywords = ExtractDescriptionKeywords(post.Description, 4);

        string baseQuery = string.Join(
            " ",
            new[] { post.Name, post.Category, suffix, descriptionKeywords }
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .Select(CleanSearchText));

        return WhitespaceRegex().Replace(baseQuery, " ").Trim();
    }

    private static string BuildFallbackSearchQuery(CompareVideoPostInput post, string language)
    {
        string suffix = language == "ar"
            ? "مراجعة"
            : "review";
        string baseQuery = string.Join(
            " ",
            new[] { post.Name, suffix }
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .Select(CleanSearchText));

        return WhitespaceRegex().Replace(baseQuery, " ").Trim();
    }

    private static string ExtractDescriptionKeywords(string? description, int maxKeywords)
    {
        if (string.IsNullOrWhiteSpace(description))
        {
            return string.Empty;
        }

        // Take the first ~200 chars, split into words, pick longer unique words
        string prefix = description.Length > 200 ? description[..200] : description;
        var keywords = WhitespaceRegex()
            .Split(CleanSearchText(prefix).ToLowerInvariant())
            .Where(word => word.Length >= 4)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(maxKeywords);

        return string.Join(" ", keywords);
    }

    private static string CleanSearchText(string value)
    {
        return value
            .Replace("JOD", " ", StringComparison.OrdinalIgnoreCase)
            .Replace("JD", " ", StringComparison.OrdinalIgnoreCase)
            .Replace("+", " ", StringComparison.Ordinal)
            .Replace("/", " ", StringComparison.Ordinal)
            .Replace("\\", " ", StringComparison.Ordinal)
            .Trim();
    }

    private static string NormalizeLanguage(string language)
    {
        return language.StartsWith("ar", StringComparison.OrdinalIgnoreCase) ? "ar" : "en";
    }

    private static IEnumerable<string> GetSearchLanguages(string language)
    {
        yield return language;

        if (language == "ar")
        {
            yield return "en";
        }
    }

    private static bool ContainsArabic(string value)
    {
        return value.Any(character => character >= '\u0600' && character <= '\u06FF');
    }

    private static bool IsLanguageMatch(string language, YouTubeSnippet? snippet, string title)
    {
        string defaultLanguage = snippet?.DefaultLanguage ?? string.Empty;
        string defaultAudioLanguage = snippet?.DefaultAudioLanguage ?? string.Empty;
        string combinedText = $"{title} {snippet?.Description}".Trim();
        bool metadataMatches = defaultLanguage.StartsWith(language, StringComparison.OrdinalIgnoreCase)
            || defaultAudioLanguage.StartsWith(language, StringComparison.OrdinalIgnoreCase);

        if (language == "ar")
        {
            return metadataMatches || ContainsArabic(combinedText);
        }

        bool metadataSaysOtherLanguage =
            IsKnownDifferentLanguage(defaultLanguage, "en")
            || IsKnownDifferentLanguage(defaultAudioLanguage, "en");

        if (metadataMatches)
        {
            return true;
        }

        if (metadataSaysOtherLanguage)
        {
            return false;
        }

        return IsLikelyEnglishText(combinedText);
    }

    private static bool IsKnownDifferentLanguage(string value, string expectedLanguage)
    {
        if (string.IsNullOrWhiteSpace(value)
            || value.Equals("und", StringComparison.OrdinalIgnoreCase)
            || value.Equals("zxx", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return !value.StartsWith(expectedLanguage, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsLikelyEnglishText(string value)
    {
        if (string.IsNullOrWhiteSpace(value) || ContainsArabic(value))
        {
            return false;
        }

        int letterCount = 0;
        int asciiLetterCount = 0;
        foreach (char character in value)
        {
            if (!char.IsLetter(character))
            {
                continue;
            }

            letterCount++;
            if (character is >= 'A' and <= 'Z' or >= 'a' and <= 'z')
            {
                asciiLetterCount++;
            }
        }

        if (letterCount == 0 || asciiLetterCount / (double)letterCount < 0.85)
        {
            return false;
        }

        string normalized = $" {WhitespaceRegex().Replace(value.ToLowerInvariant(), " ")} ";
        if (s_nonEnglishLanguageMarkers.Any(marker => normalized.Contains(marker, StringComparison.Ordinal)))
        {
            return false;
        }

        // Accept if it has English signal terms OR if >90% ASCII (likely English with a product name title)
        if (s_englishSignalTerms.Any(term => normalized.Contains(term, StringComparison.Ordinal)))
        {
            return true;
        }

        return letterCount > 0 && asciiLetterCount / (double)letterCount >= 0.92;
    }

    private static IEnumerable<string> ExtractSearchTokens(params string[] values)
    {
        return values
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .SelectMany(value => WhitespaceRegex().Split(CleanSearchText(value).ToLowerInvariant()))
            .Where(token => token.Length >= 3)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(8);
    }

    private static long ParseLong(string? rawValue)
    {
        return long.TryParse(rawValue, NumberStyles.Integer, CultureInfo.InvariantCulture, out long value)
            ? value
            : 0;
    }

    private static string BuildQueryString(Dictionary<string, string> parameters)
    {
        return string.Join(
            "&",
            parameters.Select(pair =>
                $"{Uri.EscapeDataString(pair.Key)}={Uri.EscapeDataString(pair.Value)}"));
    }

    private sealed record VideoCandidate(double Score, CompareVideoRecommendation Video);

    private sealed class YouTubeSearchResponse
    {
        public List<YouTubeSearchItem>? Items { get; init; }
    }

    private sealed class YouTubeSearchItem
    {
        public YouTubeSearchId? Id { get; init; }
    }

    private sealed class YouTubeSearchId
    {
        public string? VideoId { get; init; }
    }

    private sealed class YouTubeVideosResponse
    {
        public List<YouTubeVideoDetailsItem>? Items { get; init; }
    }

    private sealed class YouTubeVideoDetailsItem
    {
        public string? Id { get; init; }
        public YouTubeSnippet? Snippet { get; init; }
        public YouTubeStatistics? Statistics { get; init; }
    }

    private sealed class YouTubeSnippet
    {
        public string? Title { get; init; }
        public string? Description { get; init; }
        public string? ChannelTitle { get; init; }
        public string? PublishedAt { get; init; }
        public string? DefaultLanguage { get; init; }
        public string? DefaultAudioLanguage { get; init; }
        public YouTubeThumbnails? Thumbnails { get; init; }
    }

    private sealed class YouTubeThumbnails
    {
        public YouTubeThumbnail? Default { get; init; }
        public YouTubeThumbnail? Medium { get; init; }
    }

    private sealed class YouTubeThumbnail
    {
        public string? Url { get; init; }
    }

    private sealed class YouTubeStatistics
    {
        public string? ViewCount { get; init; }
    }
}
