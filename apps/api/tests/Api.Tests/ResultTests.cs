using TijarahJo.Application.Common;

namespace TijarahJo.Api.Tests;

/// <summary>
/// Tests for the generic Result&lt;T&gt; and non-generic Result types.
/// </summary>
public sealed class ResultTests
{
    [Fact]
    public void Ok_CreatesSuccessfulResult_WithValue()
    {
        var result = Result<int>.Ok(42);

        Assert.True(result.Success);
        Assert.Equal(42, result.Value);
        Assert.Null(result.ErrorCode);
        Assert.Null(result.Message);
    }

    [Fact]
    public void Fail_CreatesFailedResult_WithErrorDetails()
    {
        var result = Result<string>.Fail("NOT_FOUND", "User not found");

        Assert.False(result.Success);
        Assert.Null(result.Value);
        Assert.Equal("NOT_FOUND", result.ErrorCode);
        Assert.Equal("User not found", result.Message);
    }

    [Fact]
    public void FromException_CreatesFailedResult_FromException()
    {
        var ex = new InvalidOperationException("Something went wrong");
        var result = Result<int>.FromException("INTERNAL_ERROR", ex);

        Assert.False(result.Success);
        Assert.Equal("INTERNAL_ERROR", result.ErrorCode);
        Assert.Equal("Something went wrong", result.Message);
    }

    [Fact]
    public void Ok_WithReferenceType_ReturnsValue()
    {
        var data = new List<string> { "a", "b", "c" };
        var result = Result<List<string>>.Ok(data);

        Assert.True(result.Success);
        Assert.Equal(3, result.Value!.Count);
    }

    [Fact]
    public void Ok_WithNullableValue_CanBeNull()
    {
        var result = Result<string?>.Ok(null);

        Assert.True(result.Success);
        Assert.Null(result.Value);
    }

    [Fact]
    public void NonGeneric_Ok_CreatesSuccess()
    {
        var result = Result.Ok();

        Assert.True(result.Success);
        Assert.Null(result.ErrorCode);
        Assert.Null(result.Message);
    }

    [Fact]
    public void NonGeneric_Fail_CreatesFailure()
    {
        var result = Result.Fail("FORBIDDEN", "Access denied");

        Assert.False(result.Success);
        Assert.Equal("FORBIDDEN", result.ErrorCode);
        Assert.Equal("Access denied", result.Message);
    }

    [Fact]
    public void ErrorCodes_AreCorrectConstants()
    {
        Assert.Equal("NOT_FOUND", Result.ErrorCodes.NotFound);
        Assert.Equal("FORBIDDEN", Result.ErrorCodes.Forbidden);
        Assert.Equal("INVALID_REQUEST", Result.ErrorCodes.InvalidRequest);
        Assert.Equal("CONFLICT", Result.ErrorCodes.Conflict);
        Assert.Equal("INTERNAL_ERROR", Result.ErrorCodes.InternalError);
    }

    [Fact]
    public void Result_IsRecord_SupportsEquality()
    {
        var r1 = Result<int>.Ok(42);
        var r2 = Result<int>.Ok(42);

        Assert.Equal(r1, r2);
    }

    [Fact]
    public void Result_IsRecord_DifferentValues_NotEqual()
    {
        var r1 = Result<int>.Ok(42);
        var r2 = Result<int>.Ok(99);

        Assert.NotEqual(r1, r2);
    }
}
