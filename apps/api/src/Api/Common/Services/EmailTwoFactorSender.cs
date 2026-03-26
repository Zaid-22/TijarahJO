using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using TijarahJo.Api.Common.Configuration;

namespace TijarahJo.Api.Common.Services;

public interface IEmailTwoFactorSender
{
    Task<EmailTwoFactorSendResult> SendTwoFactorCodeAsync(
        string recipientEmail,
        string? recipientFirstName,
        string code,
        TimeSpan ttl,
        CancellationToken cancellationToken = default
    );
}

public sealed record EmailTwoFactorSendResult(
    bool Delivered,
    string? FailureMessage = null,
    string? DebugCode = null,
    bool UsedDevelopmentFallback = false
);

public sealed class EmailTwoFactorSender(
    IOptions<EmailTwoFactorOptions> options,
    IHostEnvironment hostEnvironment,
    ILogger<EmailTwoFactorSender> logger,
    IHttpClientFactory httpClientFactory) : IEmailTwoFactorSender
{
    private readonly EmailTwoFactorOptions _options = options.Value;
    private readonly IHostEnvironment _hostEnvironment = hostEnvironment;
    private readonly ILogger<EmailTwoFactorSender> _logger = logger;
    private readonly IHttpClientFactory _httpClientFactory = httpClientFactory;

    public async Task<EmailTwoFactorSendResult> SendTwoFactorCodeAsync(
        string recipientEmail,
        string? recipientFirstName,
        string code,
        TimeSpan ttl,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(recipientEmail) || string.IsNullOrWhiteSpace(code))
        {
            return new EmailTwoFactorSendResult(false, "A valid recipient email and verification code are required.");
        }

        if (!IsApiConfigured())
        {
            if (_hostEnvironment.IsDevelopment() && _options.LogCodesWhenEmailDisabled)
            {
                _logger.LogInformation(
                    "Two-factor email transport disabled in development. Recipient={Recipient} TTLMinutes={TtlMinutes}",
                    recipientEmail,
                    Math.Max(1, (int)Math.Round(ttl.TotalMinutes))
                );
                return new EmailTwoFactorSendResult(
                    true,
                    DebugCode: code,
                    UsedDevelopmentFallback: true
                );
            }

            _logger.LogWarning(
                "Two-factor email transport is not configured. Recipient={Recipient}",
                recipientEmail
            );

            return new EmailTwoFactorSendResult(
                false,
                "Two-factor email delivery is not configured on the server."
            );
        }

        string greetingName = string.IsNullOrWhiteSpace(recipientFirstName)
            ? "there"
            : recipientFirstName.Trim();
        int ttlMinutes = Math.Max(1, (int)Math.Round(ttl.TotalMinutes));

        string subject = "Your TijarahJo login code";
        string body =
            $"Hi {greetingName},\n\n" +
            $"Use this verification code to complete your login: {code}\n\n" +
            $"This code expires in {ttlMinutes} minutes.\n" +
            "If you didn't attempt to log in, please secure your account.\n\n" +
            "- TijarahJo Security";

        var payload = new
        {
            from = $"{_options.FromName} <{_options.FromAddress}>",
            to = new[] { recipientEmail },
            subject = subject,
            text = body
        };

        var requestContent = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        using var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _options.ResendApiKey);

        try
        {
            var response = await client.PostAsync("https://api.resend.com/emails", requestContent, cancellationToken);
            
            if (response.IsSuccessStatusCode)
            {
                return new EmailTwoFactorSendResult(true);
            }
            
            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError("Resend API failed. Status: {StatusCode}, Body: {Body}", response.StatusCode, errorBody);
            
            return new EmailTwoFactorSendResult(false, "Two-factor email could not be sent. Please try again later.");
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send two-factor email to {Recipient}.", recipientEmail);

            if (_hostEnvironment.IsDevelopment() && _options.LogCodesWhenEmailDisabled)
            {
                _logger.LogInformation(
                    "Using development fallback for two-factor code delivery. Recipient={Recipient}",
                    recipientEmail
                );
                return new EmailTwoFactorSendResult(
                    true,
                    DebugCode: code,
                    UsedDevelopmentFallback: true
                );
            }

            return new EmailTwoFactorSendResult(
                false,
                "Two-factor email could not be sent. Please try again later."
            );
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
}
