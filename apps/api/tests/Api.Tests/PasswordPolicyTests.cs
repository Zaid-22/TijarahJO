using TijarahJo.Application.Common;

namespace TijarahJo.Api.Tests;

public sealed class PasswordPolicyTests
{
    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void IsPasswordPolicyCompliant_ReturnsFalse_WhenNullOrWhitespace(string password)
    {
        var (isValid, _) = PasswordHelper.IsPasswordPolicyCompliant(password);
        Assert.False(isValid);
    }

    [Fact]
    public void IsPasswordPolicyCompliant_ReturnsFalse_WhenTooShort()
    {
        var (isValid, errorMessage) = PasswordHelper.IsPasswordPolicyCompliant("Ab1!");
        Assert.False(isValid);
        Assert.Contains("8 characters", errorMessage!);
    }

    [Fact]
    public void IsPasswordPolicyCompliant_ReturnsFalse_WhenNoUppercase()
    {
        var (isValid, errorMessage) = PasswordHelper.IsPasswordPolicyCompliant("password123!");
        Assert.False(isValid);
        Assert.Contains("uppercase letter", errorMessage!);
    }

    [Fact]
    public void IsPasswordPolicyCompliant_ReturnsFalse_WhenNoLowercase()
    {
        var (isValid, errorMessage) = PasswordHelper.IsPasswordPolicyCompliant("PASSWORD123!");
        Assert.False(isValid);
        Assert.Contains("lowercase letter", errorMessage!);
    }

    [Fact]
    public void IsPasswordPolicyCompliant_ReturnsFalse_WhenNoDigit()
    {
        var (isValid, errorMessage) = PasswordHelper.IsPasswordPolicyCompliant("PasswordWord!");
        Assert.False(isValid);
        Assert.Contains("digit", errorMessage!);
    }

    [Fact]
    public void IsPasswordPolicyCompliant_ReturnsFalse_WhenNoSpecialCharacter()
    {
        var (isValid, errorMessage) = PasswordHelper.IsPasswordPolicyCompliant("Password1234");
        Assert.False(isValid);
        Assert.Contains("special character", errorMessage!);
    }

    [Theory]
    [InlineData("CorrectPassword123!")]
    [InlineData("P@ssw0rd2024")]
    [InlineData("TijarahJo_12")]
    public void IsPasswordPolicyCompliant_ReturnsTrue_WhenCompliant(string password)
    {
        var (isValid, errorMessage) = PasswordHelper.IsPasswordPolicyCompliant(password);
        Assert.True(isValid);
        Assert.Null(errorMessage);
    }
}
