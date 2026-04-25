namespace TijarahJo.Application.Common;

/// <summary>
/// A generic result type for service-layer operations.
/// Encapsulates success/failure with typed value and error information,
/// replacing ad-hoc result classes across the application.
/// </summary>
public sealed record Result<T>
{
    public bool Success { get; init; }
    public T? Value { get; init; }
    public string? ErrorCode { get; init; }
    public string? Message { get; init; }

    /// <summary>Creates a successful result with the given value.</summary>
    public static Result<T> Ok(T value) => new() { Success = true, Value = value };

    /// <summary>Creates a failed result with an error code and message.</summary>
    public static Result<T> Fail(string code, string message) =>
        new() { Success = false, ErrorCode = code, Message = message };

    /// <summary>Creates a failed result from an exception.</summary>
    public static Result<T> FromException(string code, Exception ex) =>
        new() { Success = false, ErrorCode = code, Message = ex.Message };
}

/// <summary>
/// A non-generic result for operations that don't return a value.
/// </summary>
public sealed record Result
{
    public bool Success { get; init; }
    public string? ErrorCode { get; init; }
    public string? Message { get; init; }

    /// <summary>Creates a successful result.</summary>
    public static Result Ok() => new() { Success = true };

    /// <summary>Creates a failed result with an error code and message.</summary>
    public static Result Fail(string code, string message) =>
        new() { Success = false, ErrorCode = code, Message = message };

    /// <summary>Predefined error codes for common failure scenarios.</summary>
    public static class ErrorCodes
    {
        public const string NotFound = "NOT_FOUND";
        public const string Forbidden = "FORBIDDEN";
        public const string InvalidRequest = "INVALID_REQUEST";
        public const string Conflict = "CONFLICT";
        public const string InternalError = "INTERNAL_ERROR";
    }
}
