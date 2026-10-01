using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace TijarahJo.Api.Integration.Tests;

public sealed class ApiValidationIntegrationTests
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    [RequiresBaseUrlFact]
    public async Task Search_WithNegativeMinPrice_ReturnsBadRequestProblemDetails()
    {
        using var client = CreateClient(IntegrationTestEnvironment.RequireBaseUri());
        HttpResponseMessage response = await client.GetAsync("/api/v1/search?minPrice=-1");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using JsonDocument json = await ReadProblemDetailsAsync(response);
        Assert.Equal("Request validation failed.", json.RootElement.GetProperty("title").GetString());
        Assert.True(json.RootElement.TryGetProperty("errors", out JsonElement errors), "Expected validation errors object.");

        bool hasMinPriceError = errors.EnumerateObject()
            .Any(entry => entry.Name.Contains("MinPrice", StringComparison.OrdinalIgnoreCase));
        Assert.True(hasMinPriceError, "Expected validation errors for the MinPrice field.");
    }

    [RequiresBaseUrlFact]
    public async Task Signup_WithStaleJwtCookie_ReturnsValidationBadRequest_NotCsrfForbidden()
    {
        using var client = CreateClient(IntegrationTestEnvironment.RequireBaseUri());
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/signup");
        request.Headers.Add("Cookie", "jwt=stale-jwt-token");
        request.Content = JsonContent.Create(new { });

        HttpResponseMessage response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using JsonDocument json = await ReadProblemDetailsAsync(response);
        Assert.Equal("Request validation failed.", json.RootElement.GetProperty("title").GetString());
    }

    [RequiresBaseUrlFact]
    public async Task Login_WithStaleJwtCookie_ReturnsValidationBadRequest_NotCsrfForbidden()
    {
        using var client = CreateClient(IntegrationTestEnvironment.RequireBaseUri());
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/login");
        request.Headers.Add("Cookie", "jwt=stale-jwt-token");
        request.Content = JsonContent.Create(new { });

        HttpResponseMessage response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using JsonDocument json = await ReadProblemDetailsAsync(response);
        Assert.Equal("Request validation failed.", json.RootElement.GetProperty("title").GetString());
    }

    [RequiresBaseUrlFact]
    public async Task ProtectedPostCreate_WithJwtCookieOnly_WithoutCsrf_ReturnsForbidden()
    {
        using var client = CreateClient(IntegrationTestEnvironment.RequireBaseUri());
        string token = await SignUpAndGetTokenAsync(client);

        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/posts");
        request.Headers.Add("Cookie", $"jwt={token}");
        request.Content = JsonContent.Create(new { });

        HttpResponseMessage response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        using JsonDocument json = await ReadProblemDetailsAsync(response);
        Assert.Equal("CSRF validation failed.", json.RootElement.GetProperty("detail").GetString());
    }

    [RequiresBaseUrlFact]
    public async Task ProtectedPostCreate_WithBearerHeader_DoesNotFailCsrfEvenWithJwtCookie()
    {
        using var client = CreateClient(IntegrationTestEnvironment.RequireBaseUri());
        string token = await SignUpAndGetTokenAsync(client);

        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/posts");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Headers.Add("Cookie", "jwt=stale-jwt-token");
        request.Content = JsonContent.Create(new { });

        HttpResponseMessage response = await client.SendAsync(request);

        Assert.NotEqual(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [RequiresBaseUrlFact]
    public async Task Search_WithMinPriceGreaterThanMaxPrice_ReturnsBadRequestProblemDetails()
    {
        using var client = CreateClient(IntegrationTestEnvironment.RequireBaseUri());
        HttpResponseMessage response = await client.GetAsync("/api/v1/search?minPrice=250&maxPrice=100");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using JsonDocument json = await ReadProblemDetailsAsync(response);
        Assert.Equal("MinPrice cannot be greater than MaxPrice.", json.RootElement.GetProperty("detail").GetString());
    }

    [RequiresBaseUrlFact]
    public async Task Search_WithInvalidStatus_ReturnsBadRequestProblemDetails()
    {
        using var client = CreateClient(IntegrationTestEnvironment.RequireBaseUri());
        HttpResponseMessage response = await client.GetAsync("/api/v1/search?status=INVALID");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using JsonDocument json = await ReadProblemDetailsAsync(response);
        Assert.Equal("Request validation failed.", json.RootElement.GetProperty("title").GetString());
        Assert.True(json.RootElement.TryGetProperty("errors", out JsonElement errors), "Expected validation errors object.");

        bool hasStatusError = errors.EnumerateObject()
            .Any(entry => entry.Name.Contains("Status", StringComparison.OrdinalIgnoreCase));
        Assert.True(hasStatusError, "Expected validation errors for the Status field.");
    }

    [RequiresBaseUrlFact]
    public async Task Search_WithInvalidSortBy_ReturnsBadRequestProblemDetails()
    {
        using var client = CreateClient(IntegrationTestEnvironment.RequireBaseUri());
        HttpResponseMessage response = await client.GetAsync("/api/v1/search?sortBy=unknown");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using JsonDocument json = await ReadProblemDetailsAsync(response);
        Assert.Equal("Request validation failed.", json.RootElement.GetProperty("title").GetString());
        Assert.True(json.RootElement.TryGetProperty("errors", out JsonElement errors), "Expected validation errors object.");

        bool hasSortByError = errors.EnumerateObject()
            .Any(entry => entry.Name.Contains("SortBy", StringComparison.OrdinalIgnoreCase));
        Assert.True(hasSortByError, "Expected validation errors for the SortBy field.");
    }

    [RequiresBaseUrlFact]
    public async Task Search_WithInvalidSortOrder_ReturnsBadRequestProblemDetails()
    {
        using var client = CreateClient(IntegrationTestEnvironment.RequireBaseUri());
        HttpResponseMessage response = await client.GetAsync("/api/v1/search?sortOrder=up");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using JsonDocument json = await ReadProblemDetailsAsync(response);
        Assert.Equal("Request validation failed.", json.RootElement.GetProperty("title").GetString());
        Assert.True(json.RootElement.TryGetProperty("errors", out JsonElement errors), "Expected validation errors object.");

        bool hasSortOrderError = errors.EnumerateObject()
            .Any(entry => entry.Name.Contains("SortOrder", StringComparison.OrdinalIgnoreCase));
        Assert.True(hasSortOrderError, "Expected validation errors for the SortOrder field.");
    }

    [RequiresBaseUrlFact]
    public async Task UpdatePostStatus_WithInvalidStatus_ReturnsValidationProblemDetails()
    {
        using var client = CreateClient(IntegrationTestEnvironment.RequireBaseUri());
        string token = await SignUpAndGetTokenAsync(client);
        int categoryId = await GetFirstCategoryIdAsync(client);
        int postId = await CreatePostAsync(client, token, categoryId);

        using var request = new HttpRequestMessage(HttpMethod.Patch, $"/api/v1/posts/{postId}/status");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(new { status = "NOT_A_STATUS" });

        HttpResponseMessage response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using JsonDocument json = await ReadProblemDetailsAsync(response);
        Assert.Equal("Request validation failed.", json.RootElement.GetProperty("title").GetString());
        Assert.True(json.RootElement.TryGetProperty("errors", out JsonElement errors), "Expected validation errors object.");

        bool hasStatusError = errors.EnumerateObject()
            .Any(entry => entry.Name.Contains("Status", StringComparison.OrdinalIgnoreCase));
        Assert.True(hasStatusError, "Expected validation errors for the Status field.");
    }

    [RequiresBaseUrlFact]
    public async Task SellerProfile_WithInvalidSellerId_ReturnsBadRequestProblemDetails()
    {
        using var client = CreateClient(IntegrationTestEnvironment.RequireBaseUri());
        HttpResponseMessage response = await client.GetAsync("/api/v1/sellers/not-a-number");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using JsonDocument json = await ReadProblemDetailsAsync(response);
        string? detail = json.RootElement.GetProperty("detail").GetString();
        Assert.Contains("Invalid seller ID", detail ?? string.Empty, StringComparison.OrdinalIgnoreCase);
    }

    [RequiresBaseUrlFact]
    public async Task UserById_WithZeroId_ReturnsBadRequestProblemDetails()
    {
        using var client = CreateClient(IntegrationTestEnvironment.RequireBaseUri());
        HttpResponseMessage response = await client.GetAsync("/api/v1/users/0");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using JsonDocument json = await ReadProblemDetailsAsync(response);
        string? detail = json.RootElement.GetProperty("detail").GetString();
        Assert.Contains("Invalid user ID", detail ?? string.Empty, StringComparison.OrdinalIgnoreCase);
    }

    [RequiresBaseUrlFact]
    public async Task TopSellers_WithOutOfRangeTake_ReturnsBadRequestProblemDetails()
    {
        using var client = CreateClient(IntegrationTestEnvironment.RequireBaseUri());
        HttpResponseMessage response = await client.GetAsync("/api/v1/sellers/top?take=500");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using JsonDocument json = await ReadProblemDetailsAsync(response);
        Assert.Equal("Request validation failed.", json.RootElement.GetProperty("title").GetString());
        Assert.True(json.RootElement.TryGetProperty("errors", out JsonElement errors), "Expected validation errors object.");

        bool hasTakeError = errors.EnumerateObject()
            .Any(entry => entry.Name.Contains("Take", StringComparison.OrdinalIgnoreCase));
        Assert.True(hasTakeError, "Expected validation errors for the Take field.");
    }

    [RequiresBaseUrlFact]
    public async Task Favorites_Add_WithInvalidPostId_ReturnsBadRequestProblemDetails()
    {
        using var client = CreateClient(IntegrationTestEnvironment.RequireBaseUri());
        string token = await SignUpAndGetTokenAsync(client);

        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/favorites");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(new { postId = "abc" });

        HttpResponseMessage response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using JsonDocument json = await ReadProblemDetailsAsync(response);
        string? detail = json.RootElement.GetProperty("detail").GetString();
        Assert.Contains("Invalid post ID", detail ?? string.Empty, StringComparison.OrdinalIgnoreCase);
    }

    [RequiresBaseUrlFact]
    public async Task Favorites_Add_AfterDelete_RestoresSoftDeletedFavorite()
    {
        using var client = CreateClient(IntegrationTestEnvironment.RequireBaseUri());
        string token = await SignUpAndGetTokenAsync(client);
        int categoryId = await GetFirstCategoryIdAsync(client);
        int postId = await CreatePostAsync(client, token, categoryId);

        using (var addRequest = new HttpRequestMessage(HttpMethod.Post, "/api/v1/favorites"))
        {
            addRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            addRequest.Content = JsonContent.Create(new { postId = postId.ToString() });

            HttpResponseMessage addResponse = await client.SendAsync(addRequest);
            string addContent = await addResponse.Content.ReadAsStringAsync();
            Assert.True(addResponse.IsSuccessStatusCode, $"Initial favorite add failed ({(int)addResponse.StatusCode}): {addContent}");
        }

        using (var deleteRequest = new HttpRequestMessage(HttpMethod.Delete, $"/api/v1/favorites/{postId}"))
        {
            deleteRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

            HttpResponseMessage deleteResponse = await client.SendAsync(deleteRequest);
            string deleteContent = await deleteResponse.Content.ReadAsStringAsync();
            Assert.True(deleteResponse.IsSuccessStatusCode, $"Favorite delete failed ({(int)deleteResponse.StatusCode}): {deleteContent}");
        }

        using (var restoreRequest = new HttpRequestMessage(HttpMethod.Post, "/api/v1/favorites"))
        {
            restoreRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            restoreRequest.Content = JsonContent.Create(new { postId = postId.ToString() });

            HttpResponseMessage restoreResponse = await client.SendAsync(restoreRequest);
            string restoreContent = await restoreResponse.Content.ReadAsStringAsync();
            Assert.True(restoreResponse.IsSuccessStatusCode, $"Favorite restore failed ({(int)restoreResponse.StatusCode}): {restoreContent}");
        }

        using var getRequest = new HttpRequestMessage(HttpMethod.Get, "/api/v1/favorites");
        getRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        HttpResponseMessage getResponse = await client.SendAsync(getRequest);
        string getContent = await getResponse.Content.ReadAsStringAsync();
        Assert.True(getResponse.IsSuccessStatusCode, $"Favorites fetch failed ({(int)getResponse.StatusCode}): {getContent}");

        using JsonDocument json = JsonDocument.Parse(getContent);
        JsonElement favorites = json.RootElement.GetProperty("favorites");
        Assert.Contains(favorites.EnumerateArray().Select(item => item.GetString()), value => value == postId.ToString());
    }

    [RequiresBaseUrlFact]
    public async Task Notifications_MarkAsRead_WithInvalidId_ReturnsBadRequestProblemDetails()
    {
        using var client = CreateClient(IntegrationTestEnvironment.RequireBaseUri());
        string token = await SignUpAndGetTokenAsync(client);

        using var request = new HttpRequestMessage(HttpMethod.Put, "/api/v1/notifications/0/read");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        HttpResponseMessage response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using JsonDocument json = await ReadProblemDetailsAsync(response);
        string? detail = json.RootElement.GetProperty("detail").GetString();
        Assert.Contains("Invalid notification ID", detail ?? string.Empty, StringComparison.OrdinalIgnoreCase);
    }

    private static HttpClient CreateClient(Uri baseUri)
    {
        return new HttpClient
        {
            BaseAddress = baseUri,
            Timeout = TimeSpan.FromSeconds(8)
        };
    }

    private static async Task<string> SignUpAndGetTokenAsync(HttpClient client)
    {
        string email = $"integration_{Guid.NewGuid():N}@example.com";
        var signupPayload = new
        {
            Email = email,
            Password = "Str0ngPass!123",
            FirstName = "Integration",
            LastName = "Tester"
        };

        using HttpResponseMessage signupResponse = await client.PostAsJsonAsync("/api/v1/auth/signup", signupPayload);
        string signupContent = await signupResponse.Content.ReadAsStringAsync();
        Assert.True(signupResponse.IsSuccessStatusCode, $"Signup failed ({(int)signupResponse.StatusCode}): {signupContent}");

        using (JsonDocument signupJson = JsonDocument.Parse(signupContent))
        {
            Assert.True(
                signupJson.RootElement.TryGetProperty("RequiresEmailVerification", out JsonElement requiresVerification) &&
                requiresVerification.GetBoolean(),
                "Signup response did not require email verification.");
        }

        bool signupIssuedJwt =
            signupResponse.Headers.TryGetValues("Set-Cookie", out IEnumerable<string>? signupCookieHeaders) &&
            signupCookieHeaders.Any(header => header.StartsWith("jwt=", StringComparison.Ordinal));
        Assert.False(signupIssuedJwt, "Signup issued a JWT before email verification.");

        string verificationToken = await WaitForEmailVerificationTokenAsync(email);
        using HttpResponseMessage verifyResponse = await client.PostAsJsonAsync(
            "/api/v1/auth/verify-email",
            new { Token = verificationToken });
        string verifyContent = await verifyResponse.Content.ReadAsStringAsync();
        Assert.True(
            verifyResponse.IsSuccessStatusCode,
            $"Email verification failed ({(int)verifyResponse.StatusCode}): {verifyContent}");
        Assert.True(
            verifyResponse.Headers.TryGetValues("Set-Cookie", out IEnumerable<string>? cookieHeaders),
            "Email verification response did not include any Set-Cookie headers.");

        string? jwtCookie = cookieHeaders
            .FirstOrDefault(header => header.StartsWith("jwt=", StringComparison.Ordinal));
        Assert.False(string.IsNullOrWhiteSpace(jwtCookie), "Email verification response did not set the jwt cookie.");

        string token = jwtCookie!.Split(';', 2)[0]["jwt=".Length..];
        Assert.False(string.IsNullOrWhiteSpace(token), "JWT cookie did not contain a token value.");
        return token;
    }

    private static async Task<string> WaitForEmailVerificationTokenAsync(string email)
    {
        string logPath = Environment.GetEnvironmentVariable("BACKEND_LOG_FILE")
            ?? Path.Combine(Path.GetTempPath(), "tijarahjo_bootstrap_backend.log");
        DateTime deadlineUtc = DateTime.UtcNow.AddSeconds(10);
        Regex tokenPattern = new(
            $@"Recipient={Regex.Escape(email)}\s+Link=\S*[?&]token=(?<token>\S+)",
            RegexOptions.CultureInvariant);

        while (DateTime.UtcNow < deadlineUtc)
        {
            try
            {
                if (File.Exists(logPath))
                {
                    string logContents = await File.ReadAllTextAsync(logPath);
                    Match? match = tokenPattern.Matches(logContents).LastOrDefault();
                    if (match?.Success == true)
                    {
                        return Uri.UnescapeDataString(match.Groups["token"].Value);
                    }
                }
            }
            catch (IOException)
            {
                // The backend may be appending to the log; retry until the deadline.
            }

            await Task.Delay(100);
        }

        throw new InvalidOperationException(
            $"No email verification token for {email} appeared in backend log {logPath}.");
    }

    private static async Task<int> GetFirstCategoryIdAsync(HttpClient client)
    {
        HttpResponseMessage response = await client.GetAsync("/api/v1/categories");
        string content = await response.Content.ReadAsStringAsync();
        Assert.True(response.IsSuccessStatusCode, $"Fetching categories failed ({(int)response.StatusCode}): {content}");

        List<CategoryResponse>? categories = JsonSerializer.Deserialize<List<CategoryResponse>>(content, JsonOptions);
        Assert.NotNull(categories);
        Assert.NotEmpty(categories!);
        Assert.True(categories![0].CategoryID > 0, "Expected a valid category ID in seed data.");
        return categories[0].CategoryID;
    }

    private static async Task<(int CityId, int AreaId)> GetFirstCityAndAreaAsync(HttpClient client)
    {
        HttpResponseMessage citiesResponse = await client.GetAsync("/api/v1/cities");
        string citiesContent = await citiesResponse.Content.ReadAsStringAsync();
        Assert.True(citiesResponse.IsSuccessStatusCode, $"Fetching cities failed ({(int)citiesResponse.StatusCode}): {citiesContent}");

        List<CityResponse>? cities = JsonSerializer.Deserialize<List<CityResponse>>(citiesContent, JsonOptions);
        Assert.NotNull(cities);
        Assert.NotEmpty(cities!);
        int cityId = cities![0].CityId;
        Assert.True(cityId > 0, "Expected a valid city ID in seed data.");

        HttpResponseMessage areasResponse = await client.GetAsync($"/api/v1/cities/{cityId}/areas");
        string areasContent = await areasResponse.Content.ReadAsStringAsync();
        Assert.True(areasResponse.IsSuccessStatusCode, $"Fetching areas failed ({(int)areasResponse.StatusCode}): {areasContent}");

        List<AreaResponse>? areas = JsonSerializer.Deserialize<List<AreaResponse>>(areasContent, JsonOptions);
        Assert.NotNull(areas);
        Assert.NotEmpty(areas!);
        int areaId = areas![0].AreaId;
        Assert.True(areaId > 0, "Expected a valid area ID in seed data.");

        return (cityId, areaId);
    }

    private static async Task<int> CreatePostAsync(HttpClient client, string token, int categoryId)
    {
        (int cityId, int areaId) = await GetFirstCityAndAreaAsync(client);

        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/posts");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(new
        {
            CategoryID = categoryId,
            PostTitle = $"Integration Status Test {Guid.NewGuid():N}",
            PostDescription = "Integration test post.",
            Price = 15.0m,
            CityId = cityId,
            AreaId = areaId
        });

        HttpResponseMessage response = await client.SendAsync(request);
        string content = await response.Content.ReadAsStringAsync();
        Assert.True(response.IsSuccessStatusCode, $"Create post failed ({(int)response.StatusCode}): {content}");

        PostResponse? post = JsonSerializer.Deserialize<PostResponse>(content, JsonOptions);
        Assert.NotNull(post);
        Assert.True(post!.PostID.HasValue && post.PostID.Value > 0, "Created post response did not include PostID.");
        return post.PostID!.Value;
    }

    private static async Task<JsonDocument> ReadProblemDetailsAsync(HttpResponseMessage response)
    {
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        string content = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(content), "Expected a ProblemDetails JSON body.");
        return JsonDocument.Parse(content);
    }

    private sealed class CategoryResponse
    {
        public int CategoryID { get; set; }
    }

    private sealed class CityResponse
    {
        public int CityId { get; set; }
    }

    private sealed class AreaResponse
    {
        public int AreaId { get; set; }
    }

    private sealed class PostResponse
    {
        public int? PostID { get; set; }
    }
}
