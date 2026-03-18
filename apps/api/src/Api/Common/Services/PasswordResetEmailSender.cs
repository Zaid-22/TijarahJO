using System.Net;
using System.Net.Mail;
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
}

public sealed class PasswordResetEmailSender : IPasswordResetEmailSender
{
    private readonly PasswordResetEmailOptions _options;
    private readonly ILogger<PasswordResetEmailSender> _logger;

    public PasswordResetEmailSender(
        IOptions<PasswordResetEmailOptions> options,
        ILogger<PasswordResetEmailSender> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

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

        if (!IsSmtpConfigured())
        {
            if (_options.LogCodesWhenEmailDisabled)
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

        using var mail = new MailMessage
        {
            From = new MailAddress(_options.FromAddress, _options.FromName),
            Subject = subject,
            Body = body,
            IsBodyHtml = false
        };
        mail.To.Add(recipientEmail);

        using var smtp = new SmtpClient(_options.Host, _options.Port)
        {
            EnableSsl = _options.EnableSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network
        };

        if (!string.IsNullOrWhiteSpace(_options.Username))
        {
            smtp.Credentials = new NetworkCredential(_options.Username, _options.Password);
        }

        await smtp.SendMailAsync(mail, cancellationToken).WaitAsync(cancellationToken);
    }

    private bool IsSmtpConfigured()
    {
        if (!_options.Enabled)
        {
            return false;
        }

        return !string.IsNullOrWhiteSpace(_options.Host)
            && !string.IsNullOrWhiteSpace(_options.FromAddress);
    }
}
