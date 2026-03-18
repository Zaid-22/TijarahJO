namespace TijarahJoDB.DAL.Entities;

/// <summary>
/// Represents a JWT that has been revoked (e.g. on logout).
/// Stored in the database so blacklist survives server restarts.
/// </summary>
public sealed class BlacklistedTokenEntity
{
    /// <summary>JWT ID (jti claim) — primary key.</summary>
    public string Jti { get; set; } = string.Empty;

    /// <summary>When the original JWT token expires. Rows past this time can be purged.</summary>
    public DateTime ExpiresAt { get; set; }
}
