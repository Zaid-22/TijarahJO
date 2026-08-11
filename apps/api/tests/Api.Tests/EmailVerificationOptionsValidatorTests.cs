using TijarahJo.Api.Common.Configuration;

namespace TijarahJo.Api.Tests;

public sealed class EmailVerificationOptionsValidatorTests
{
    [Fact]
    public void Validate_RejectsDisabledOrPlaceholderDelivery_InProduction()
    {
        var validator = new EmailVerificationOptionsValidator(requireConfiguredDelivery: true);
        var options = new EmailVerificationOptions
        {
            Enabled = false,
            ResendApiKey = "re_CHANGE_ME_RESEND_API_KEY",
            FromAddress = "not-an-email"
        };

        var result = validator.Validate(null, options);

        Assert.True(result.Failed);
        Assert.Contains(result.Failures, failure => failure.Contains("Enabled", StringComparison.Ordinal));
        Assert.Contains(result.Failures, failure => failure.Contains("ResendApiKey", StringComparison.Ordinal));
        Assert.Contains(result.Failures, failure => failure.Contains("FromAddress", StringComparison.Ordinal));
    }

    [Fact]
    public void Validate_AcceptsConfiguredDelivery_InProduction()
    {
        var validator = new EmailVerificationOptionsValidator(requireConfiguredDelivery: true);
        var options = new EmailVerificationOptions
        {
            Enabled = true,
            ResendApiKey = "re_unit_test_key",
            FromAddress = "security@example.com",
            FromName = "TijarahJo",
            TokenLifetimeMinutes = 1440,
            RequestCooldownSeconds = 60
        };

        var result = validator.Validate(null, options);

        Assert.True(result.Succeeded);
    }

    [Fact]
    public void Validate_AllowsDevelopmentFallback_WhenDeliveryIsNotRequired()
    {
        var validator = new EmailVerificationOptionsValidator(requireConfiguredDelivery: false);

        var result = validator.Validate(null, new EmailVerificationOptions
        {
            Enabled = true,
            ResendApiKey = string.Empty,
            LogTokensWhenEmailDisabled = true
        });

        Assert.True(result.Succeeded);
    }
}
