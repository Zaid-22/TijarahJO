using TijarahJo.Domain.Enums;

namespace TijarahJo.Api.Tests;

/// <summary>
/// Contract tests for domain status enums.
/// Ensures enum values match the database schema and are not accidentally changed.
/// </summary>
public sealed class StatusEnumContractTests
{
    [Theory]
    [InlineData(UserStatus.Active, 1)]
    [InlineData(UserStatus.Banned, 2)]
    [InlineData(UserStatus.Inactive, 3)]
    public void UserStatus_HasExpectedIntegerValues(UserStatus status, int expected)
    {
        Assert.Equal(expected, (int)status);
    }

    [Theory]
    [InlineData(PostStatus.Active, 0)]
    [InlineData(PostStatus.Blocked, 1)]
    [InlineData(PostStatus.Sold, 3)]
    public void PostStatus_HasExpectedIntegerValues(PostStatus status, int expected)
    {
        Assert.Equal(expected, (int)status);
    }

    [Fact]
    public void UserStatus_HasExactly3Members()
    {
        var values = Enum.GetValues<UserStatus>();
        Assert.Equal(3, values.Length);
    }

    [Fact]
    public void PostStatus_HasExactly3Members()
    {
        var values = Enum.GetValues<PostStatus>();
        Assert.Equal(3, values.Length);
    }

    [Fact]
    public void UserStatus_DefaultValue_IsNotActive()
    {
        // Default int(0) should not map to Active(1), preventing accidental "active" users
        var defaultStatus = (UserStatus)0;
        Assert.NotEqual(UserStatus.Active, defaultStatus);
    }

    [Theory]
    [InlineData(ReportStatus.Pending, 0)]
    [InlineData(ReportStatus.UnderReview, 1)]
    [InlineData(ReportStatus.Resolved, 2)]
    [InlineData(ReportStatus.Dismissed, 3)]
    public void ReportStatus_HasExpectedIntegerValues(ReportStatus status, int expected)
    {
        Assert.Equal(expected, (int)status);
    }

    [Fact]
    public void ReportStatus_HasExactly4Members()
    {
        var values = Enum.GetValues<ReportStatus>();
        Assert.Equal(4, values.Length);
    }
}
