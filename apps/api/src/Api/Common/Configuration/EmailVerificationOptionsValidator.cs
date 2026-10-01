using System.Net.Mail;
using Microsoft.Extensions.Options;

namespace TijarahJo.Api.Common.Configuration;

public sealed class EmailVerificationOptionsValidator(bool requireConfiguredDelivery)
    : IValidateOptions<EmailVerificationOptions>
{
    public ValidateOptionsResult Validate(string? name, EmailVerificationOptions options)
    {
        if (!requireConfiguredDelivery)
        {
            return ValidateOptionsResult.Success;
        }

        List<string> failures = [];
        if (!options.Enabled)
        {
            failures.Add("EmailVerification:Enabled must be true in production.");
        }

        if (string.IsNullOrWhiteSpace(options.ResendApiKey)
            || options.ResendApiKey.Contains("CHANGE_ME", StringComparison.OrdinalIgnoreCase))
        {
            failures.Add("EmailVerification:ResendApiKey must contain a production Resend API key.");
        }

        if (!MailAddress.TryCreate(options.FromAddress, out _))
        {
            failures.Add("EmailVerification:FromAddress must be a valid email address.");
        }

        if (string.IsNullOrWhiteSpace(options.FromName))
        {
            failures.Add("EmailVerification:FromName is required.");
        }

        if (options.TokenLifetimeMinutes is < 5 or > 10080)
        {
            failures.Add("EmailVerification:TokenLifetimeMinutes must be between 5 and 10080.");
        }

        if (options.RequestCooldownSeconds < 0)
        {
            failures.Add("EmailVerification:RequestCooldownSeconds cannot be negative.");
        }

        return failures.Count == 0
            ? ValidateOptionsResult.Success
            : ValidateOptionsResult.Fail(failures);
    }
}
