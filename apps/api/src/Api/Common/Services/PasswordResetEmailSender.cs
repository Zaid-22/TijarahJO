using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using TijarahJo.Api.Common.Configuration;

namespace TijarahJo.Api.Common.Services;

public interface IPasswordResetEmailSender
{
    Task SendPasswordResetCodeAsync(
        string recipientEmail,
        string? recipientFirstName,
        string code,
        TimeSpan ttl,
        CancellationToken cancellationToken = default
    );

    /// <summary>Returns true when the email transport is enabled and has a valid API key.</summary>
    bool IsTransportConfigured();
}

public sealed class PasswordResetEmailSender(
    IOptions<PasswordResetEmailOptions> options,
    ILogger<PasswordResetEmailSender> logger,
    IHttpClientFactory httpClientFactory) : IPasswordResetEmailSender
{
    private readonly PasswordResetEmailOptions _options = options.Value;
    private readonly ILogger<PasswordResetEmailSender> _logger = logger;
    private readonly IHttpClientFactory _httpClientFactory = httpClientFactory;

    public async Task SendPasswordResetCodeAsync(
        string recipientEmail,
        string? recipientFirstName,
        string code,
        TimeSpan ttl,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(recipientEmail) || string.IsNullOrWhiteSpace(code))
        {
            return;
        }

        if (!IsTransportConfigured())
        {
            if (_options.LogCodesWhenEmailDisabled && _logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation(
                    "Password reset email transport disabled. Recipient={Recipient} Code={Code} TTLMinutes={TtlMinutes}",
                    recipientEmail,
                    code,
                    Math.Max(1, (int)Math.Round(ttl.TotalMinutes))
                );
            }

            return;
        }

        string greetingName = string.IsNullOrWhiteSpace(recipientFirstName)
            ? "there"
            : recipientFirstName.Trim();
        int ttlMinutes = Math.Max(1, (int)Math.Round(ttl.TotalMinutes));

        string subject = "Your TijarahJo password reset code";
        string body =
            $"Hi {greetingName},\n\n" +
            $"Use this verification code to reset your password: {code}\n\n" +
            $"This code expires in {ttlMinutes} minutes.\n" +
            "If you didn't request a password reset, you can ignore this email.\n\n" +
            "- TijarahJo Security";

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

        try
        {
            var response = await client.PostAsync("https://api.resend.com/emails", requestContent, cancellationToken);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Resend API failed for Password Reset. Status: {StatusCode}, Body: {Body}", response.StatusCode, errorBody);
            }
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send password reset email to {Recipient}.", recipientEmail);
        }
    }

    public bool IsTransportConfigured()
    {
        return _options.Enabled
            && !string.IsNullOrWhiteSpace(_options.ResendApiKey)
            && !string.IsNullOrWhiteSpace(_options.FromAddress);
    }
}
