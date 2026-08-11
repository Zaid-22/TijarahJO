using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Api.Common.Configuration;

namespace TijarahJo.Api.Common.Services;

// -------------------------------------------------------------------------
// Result types
// -------------------------------------------------------------------------

public enum EmailVerificationRequestFailureReason
{
    FeatureDisabled,
    InvalidRequest,
    UserNotFound,
    AlreadyVerified,
    CooldownActive,
    EmailSendFailed
}

public sealed class EmailVerificationRequestResult
{
    public bool Success { get; init; }
    public EmailVerificationRequestFailureReason? FailureReason { get; init; }
    public string? Message { get; init; }

    public static EmailVerificationRequestResult Ok(string? message = null) =>
        new() { Success = true, Message = message };

    public static EmailVerificationRequestResult Failed(
        EmailVerificationRequestFailureReason reason, string message) =>
        new() { Success = false, FailureReason = reason, Message = message };
}

public enum EmailVerificationConfirmFailureReason
{
    InvalidToken,
    ExpiredToken,
    UserNotFound,
    PersistenceFailed
}

public sealed class EmailVerificationConfirmResult
{
    public bool Success { get; init; }
    public EmailVerificationConfirmFailureReason? FailureReason { get; init; }
    public string? Message { get; init; }
    /// <summary>The verified user, present only on a successful confirmation.</summary>
    public UserModel? User { get; init; }

    public static EmailVerificationConfirmResult Ok(UserModel? user = null) =>
        new() { Success = true, Message = "Email verified successfully.", User = user };

    public static EmailVerificationConfirmResult Failed(
        EmailVerificationConfirmFailureReason reason, string message) =>
        new() { Success = false, FailureReason = reason, Message = message };
}

// -------------------------------------------------------------------------
// Interface
// -------------------------------------------------------------------------

public interface IEmailVerificationService
{
    /// <summary>
    /// Generates a verification token, stores its hash, and sends the verification email.
    /// Called from the signup flow.
    /// </summary>
    Task<EmailVerificationRequestResult> SendVerificationAsync(
        int userId, string email, string? firstName,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates the raw token from the verification link, marks the user as verified,
    /// and cleans up the challenge state.
    /// </summary>
    Task<EmailVerificationConfirmResult> ConfirmVerificationAsync(
        string? token, CancellationToken cancellationToken = default);

    /// <summary>
    /// Looks up the user by email, enforces a cooldown, and resends the verification email.
    /// </summary>
    Task<EmailVerificationRequestResult> ResendVerificationAsync(
        string? email, CancellationToken cancellationToken = default);
}

// -------------------------------------------------------------------------
// Implementation
// -------------------------------------------------------------------------

public sealed class EmailVerificationService(
    IUserDataAccess users,
    IVerificationChallengeDataAccess challenges,
    IOptions<EmailVerificationOptions> options,
    IConfiguration configuration,
    ILogger<EmailVerificationService> logger,
    IHttpClientFactory httpClientFactory,
    JwtOptions jwtOptions) : IEmailVerificationService
{
    private const string ChallengeType = "EmailVerification";
    private const int TokenByteLength = 32;

    private readonly IUserDataAccess _users = users;
    private readonly IVerificationChallengeDataAccess _challenges = challenges;
    private readonly EmailVerificationOptions _options = options.Value;
    private readonly IConfiguration _configuration = configuration;
    private readonly ILogger<EmailVerificationService> _logger = logger;
    private readonly IHttpClientFactory _httpClientFactory = httpClientFactory;
    private readonly byte[] _hmacKey = Encoding.UTF8.GetBytes(jwtOptions.SigningKey);

    // =====================================================================
    // SendVerificationAsync
    // =====================================================================

    public async Task<EmailVerificationRequestResult> SendVerificationAsync(
        int userId, string email, string? firstName,
        CancellationToken cancellationToken = default)
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation("Email verification is disabled. Skipping for user {UserId}.", userId);
            return EmailVerificationRequestResult.Failed(
                EmailVerificationRequestFailureReason.FeatureDisabled,
                "Email verification is currently disabled.");
        }

        string? expectedStateJson = await _challenges.GetChallengeStateAsync(
            userId, ChallengeType, cancellationToken);

        // Generate a cryptographically secure random token
        byte[] tokenBytes = RandomNumberGenerator.GetBytes(TokenByteLength);
        string rawToken = Base64UrlEncode(tokenBytes);

        // The stored token is: "{userId}.{rawToken}" — userId prefix for direct lookup
        string compositeToken = $"{userId}.{rawToken}";

        // Hash the raw token for secure storage
        byte[] tokenHash = ComputeTokenHash(email.ToLowerInvariant(), rawToken);
        DateTimeOffset now = DateTimeOffset.UtcNow;
        int lifetimeMinutes = Math.Clamp(_options.TokenLifetimeMinutes, 5, 10080); // 5 min to 7 days

        var challengeState = new EmailVerificationChallengeState(
            userId,
            tokenHash,
            now.AddMinutes(lifetimeMinutes),
            now
        );

        string stateJson = JsonSerializer.Serialize(challengeState);
        bool stored = await _challenges.TryReplaceChallengeStateAsync(
            userId,
            ChallengeType,
            expectedStateJson,
            stateJson,
            challengeState.ExpiresAtUtc.UtcDateTime,
            cancellationToken
        );
        if (!stored)
        {
            return EmailVerificationRequestResult.Ok(
                "A verification email is already being sent. Please check your inbox.");
        }

        // Build verification link
        string frontendUrl = ResolveFrontendUrl();
        string verificationLink = $"{frontendUrl}/verify-email?token={Uri.EscapeDataString(compositeToken)}";

        // Send email
        try
        {
            await SendVerificationEmailAsync(
                email,
                firstName,
                verificationLink,
                lifetimeMinutes,
                cancellationToken
            );
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // Clean up challenge state if email send fails
            await _challenges.TryDeleteChallengeStateAsync(
                userId, ChallengeType, stateJson, cancellationToken);
            _logger.LogWarning(
                ex,
                "Email verification send failed for user {UserId} ({Email}). Challenge was discarded.",
                userId, email
            );
            return EmailVerificationRequestResult.Failed(
                EmailVerificationRequestFailureReason.EmailSendFailed,
                "Unable to send verification email. Please try again.");
        }

        return EmailVerificationRequestResult.Ok("Verification email sent.");
    }

    // =====================================================================
    // ConfirmVerificationAsync
    // =====================================================================

    public async Task<EmailVerificationConfirmResult> ConfirmVerificationAsync(
        string? token, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return EmailVerificationConfirmResult.Failed(
                EmailVerificationConfirmFailureReason.InvalidToken,
                "Verification token is required.");
        }

        // Parse composite token: "{userId}.{rawToken}"
        string trimmedToken = token.Trim();
        int dotIndex = trimmedToken.IndexOf('.');
        if (dotIndex <= 0 || dotIndex >= trimmedToken.Length - 1)
        {
            return EmailVerificationConfirmResult.Failed(
                EmailVerificationConfirmFailureReason.InvalidToken,
                "Invalid verification token format.");
        }

        if (!int.TryParse(trimmedToken[..dotIndex], out int userId) || userId < 1)
        {
            return EmailVerificationConfirmResult.Failed(
                EmailVerificationConfirmFailureReason.InvalidToken,
                "Invalid verification token.");
        }

        string rawToken = trimmedToken[(dotIndex + 1)..];

        // Look up the user
        UserModel? user = await _users.GetUserByIDAsync(userId, cancellationToken);
        if (user == null || user.UserID == null)
        {
            return EmailVerificationConfirmResult.Failed(
                EmailVerificationConfirmFailureReason.UserNotFound,
                "User account not found.");
        }

        // Verification is also an authentication flow because the controller issues
        // a JWT on success. Never treat an unvalidated token as an idempotent success.
        if (user.IsEmailVerified)
        {
            return EmailVerificationConfirmResult.Failed(
                EmailVerificationConfirmFailureReason.InvalidToken,
                "Verification token is invalid or no longer available.");
        }

        // Load challenge state
        string? stateStr = await _challenges.GetChallengeStateAsync(userId, ChallengeType, cancellationToken);
        if (string.IsNullOrEmpty(stateStr))
        {
            return EmailVerificationConfirmResult.Failed(
                EmailVerificationConfirmFailureReason.ExpiredToken,
                "Verification link has expired. Please request a new one.");
        }

        EmailVerificationChallengeState? challenge;
        try
        {
            challenge = JsonSerializer.Deserialize<EmailVerificationChallengeState>(stateStr);
        }
        catch (JsonException)
        {
            await _challenges.TryDeleteChallengeStateAsync(
                userId, ChallengeType, stateStr, cancellationToken);
            return EmailVerificationConfirmResult.Failed(
                EmailVerificationConfirmFailureReason.ExpiredToken,
                "Verification link has expired. Please request a new one.");
        }

        if (challenge == null || challenge.ExpiresAtUtc <= DateTimeOffset.UtcNow)
        {
            await _challenges.TryDeleteChallengeStateAsync(
                userId, ChallengeType, stateStr, cancellationToken);
            return EmailVerificationConfirmResult.Failed(
                EmailVerificationConfirmFailureReason.ExpiredToken,
                "Verification link has expired. Please request a new one.");
        }

        // Verify HMAC hash with constant-time comparison
        string normalizedEmail = user.Email.Trim().ToLowerInvariant();
        byte[] providedHash = ComputeTokenHash(normalizedEmail, rawToken);
        byte[] expectedHash = challenge.TokenHash;

        bool lengthMatch = expectedHash.Length == providedHash.Length;
        int maxLen = Math.Max(expectedHash.Length, providedHash.Length);
        byte[] p1 = new byte[maxLen];
        byte[] p2 = new byte[maxLen];
        Array.Copy(expectedHash, p1, expectedHash.Length);
        Array.Copy(providedHash, p2, providedHash.Length);

        bool isValid = lengthMatch && CryptographicOperations.FixedTimeEquals(p1, p2);
        if (!isValid)
        {
            return EmailVerificationConfirmResult.Failed(
                EmailVerificationConfirmFailureReason.InvalidToken,
                "Invalid verification token.");
        }

        if (!await _challenges.TryDeleteChallengeStateAsync(
                userId, ChallengeType, stateStr, cancellationToken))
        {
            return EmailVerificationConfirmResult.Failed(
                EmailVerificationConfirmFailureReason.InvalidToken,
                "Verification link has expired. Please request a new one.");
        }

        // Mark user as verified
        var verifiedUser = user with { IsEmailVerified = true };
        bool updated = await _users.UpdateUserFieldsAsync(
            verifiedUser,
            userId,
            UserUpdateFields.IsEmailVerified,
            cancellationToken);
        if (!updated)
        {
            return EmailVerificationConfirmResult.Failed(
                EmailVerificationConfirmFailureReason.PersistenceFailed,
                "Unable to verify email. Please try again.");
        }

        _logger.LogInformation("Email verified successfully for user {UserId}.", userId);
        return EmailVerificationConfirmResult.Ok(verifiedUser);
    }

    // =====================================================================
    // ResendVerificationAsync
    // =====================================================================

    public async Task<EmailVerificationRequestResult> ResendVerificationAsync(
        string? email, CancellationToken cancellationToken = default)
    {
        if (!_options.Enabled)
        {
            return EmailVerificationRequestResult.Failed(
                EmailVerificationRequestFailureReason.FeatureDisabled,
                "Email verification is currently disabled.");
        }

        if (string.IsNullOrWhiteSpace(email))
        {
            return EmailVerificationRequestResult.Failed(
                EmailVerificationRequestFailureReason.InvalidRequest,
                "Email address is required.");
        }

        string normalizedEmail = email.Trim().ToLowerInvariant();

        UserModel? user = await _users.GetUserByLoginAsync(normalizedEmail, cancellationToken);
        if (user == null || user.UserID == null || user.IsDeleted)
        {
            // Don't reveal whether the email exists — always return success-like response
            return EmailVerificationRequestResult.Ok("If an account exists with this email, a verification link has been sent.");
        }

        if (user.IsEmailVerified)
        {
            return EmailVerificationRequestResult.Ok("Email is already verified. You can log in.");
        }

        // Enforce cooldown
        string? stateStr = await _challenges.GetChallengeStateAsync(user.UserID.Value, ChallengeType, cancellationToken);
        if (!string.IsNullOrEmpty(stateStr))
        {
            try
            {
                var existingChallenge = JsonSerializer.Deserialize<EmailVerificationChallengeState>(stateStr);
                DateTimeOffset now = DateTimeOffset.UtcNow;
                int cooldownSeconds = Math.Clamp(_options.RequestCooldownSeconds, 0, 600);
                if (existingChallenge != null &&
                    existingChallenge.ExpiresAtUtc > now &&
                    now - existingChallenge.SentAtUtc < TimeSpan.FromSeconds(cooldownSeconds))
                {
                    return EmailVerificationRequestResult.Ok("Verification email was recently sent. Please check your inbox.");
                }
            }
            catch (JsonException) { /* Override corrupt state */ }
        }

        return await SendVerificationAsync(user.UserID.Value, normalizedEmail, user.FirstName, cancellationToken);
    }

    // =====================================================================
    // Email sending (Resend API — matches PasswordResetEmailSender pattern)
    // =====================================================================

    private async Task SendVerificationEmailAsync(
        string recipientEmail,
        string? recipientFirstName,
        string verificationLink,
        int lifetimeMinutes,
        CancellationToken cancellationToken)
    {
        if (!IsApiConfigured())
        {
            if (_options.LogTokensWhenEmailDisabled && _logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation(
                    "Email verification transport disabled. Recipient={Recipient} Link={Link} TTLMinutes={TtlMinutes}",
                    recipientEmail,
                    verificationLink,
                    lifetimeMinutes
                );
                return;
            }

            throw new InvalidOperationException(
                "Email verification delivery is not configured on the server.");
        }

        string greetingName = string.IsNullOrWhiteSpace(recipientFirstName)
            ? "there"
            : recipientFirstName.Trim();

        int displayHours = Math.Max(1, lifetimeMinutes / 60);
        string ttlDisplay = displayHours == 1 ? "1 hour" : $"{displayHours} hours";

        string subject = "Verify your TijarahJo email address";
        string body =
            $"Hi {greetingName},\n\n" +
            "Please verify your email address by clicking the link below:\n\n" +
            $"{verificationLink}\n\n" +
            $"This link expires in {ttlDisplay}.\n\n" +
            "If you didn't create a TijarahJo account, you can ignore this email.\n\n" +
            "— TijarahJo";

        var payload = new
        {
            from = $"{_options.FromName} <{_options.FromAddress}>",
            to = new[] { recipientEmail },
            subject,
            text = body
        };

        var requestContent = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        using var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _options.ResendApiKey);

        var response = await client.PostAsync("https://api.resend.com/emails", requestContent, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError(
                "Resend API failed for Email Verification. Status: {StatusCode}, Body: {Body}",
                response.StatusCode, errorBody
            );
            throw new InvalidOperationException(
                $"Resend API returned {response.StatusCode} for email verification.");
        }
    }

    private bool IsApiConfigured()
    {
        if (!_options.Enabled)
        {
            return false;
        }

        return !string.IsNullOrWhiteSpace(_options.ResendApiKey)
            && !string.IsNullOrWhiteSpace(_options.FromAddress);
    }

    // =====================================================================
    // Helpers
    // =====================================================================

    private byte[] ComputeTokenHash(string normalizedEmail, string rawToken)
    {
        string payload = $"{normalizedEmail}:{rawToken}";
        using var hmac = new HMACSHA256(_hmacKey);
        return hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
    }

    private static string Base64UrlEncode(byte[] data)
    {
        return Convert.ToBase64String(data)
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');
    }

    private string ResolveFrontendUrl()
    {
        // Check environment variable first (matches existing FRONTEND_URL pattern),
        // then fall back to configuration key FrontendUrl.
        string? url = Environment.GetEnvironmentVariable("FRONTEND_URL");
        if (string.IsNullOrWhiteSpace(url))
        {
            url = _configuration["FrontendUrl"];
        }
        if (string.IsNullOrWhiteSpace(url))
        {
            url = "http://localhost:5173";
        }
        return url.TrimEnd('/');
    }

    // =====================================================================
    // Challenge state record
    // =====================================================================

    private sealed record EmailVerificationChallengeState(
        int UserId,
        byte[] TokenHash,
        DateTimeOffset ExpiresAtUtc,
        DateTimeOffset SentAtUtc
    );
}
