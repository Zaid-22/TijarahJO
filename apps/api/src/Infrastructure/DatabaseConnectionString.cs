namespace TijarahJo.Infrastructure;

/// <summary>
/// Strongly-typed wrapper for injecting the resolved connection string
/// into services that use raw SQL (e.g. PostListingQueryService).
/// Registered as a singleton during DI composition.
/// </summary>
public sealed class DatabaseConnectionString(string value)
{
    public string Value { get; } = value;
}
