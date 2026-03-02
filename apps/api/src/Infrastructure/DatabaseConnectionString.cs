namespace TijarahJoDB_DataAccess;

/// <summary>
/// Strongly-typed wrapper for injecting the resolved connection string
/// into services that use raw SQL (e.g. PostListingQueryService).
/// Registered as a singleton during DI composition.
/// </summary>
public sealed class DatabaseConnectionString
{
    public string Value { get; }
    public DatabaseConnectionString(string value) => Value = value;
}
