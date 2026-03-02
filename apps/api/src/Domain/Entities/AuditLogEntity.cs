using System;

namespace TijarahJoDB.DAL.Entities;

/// <summary>
/// Represents a single audit entry recording a data mutation on a key table.
/// Written by <see cref="TijarahJoDB.DAL.Persistence.TijarahJoDbContext.SaveChangesAsync"/>
/// in the same transaction as the primary change.
/// </summary>
public sealed class AuditLogEntity
{
    public long AuditLogID { get; set; }

    /// <summary>Name of the table that was mutated, e.g. "Users", "Posts".</summary>
    public string TableName { get; set; } = string.Empty;

    /// <summary>Primary key of the affected row.</summary>
    public int RecordID { get; set; }

    /// <summary>"INSERT", "UPDATE", or "DELETE".</summary>
    public string Action { get; set; } = string.Empty;

    /// <summary>UserID of the actor who triggered the change. Null for system/unauthenticated operations.</summary>
    public int? ChangedByUserID { get; set; }

    /// <summary>UTC timestamp at the moment of the change.</summary>
    public DateTime ChangedAt { get; set; }

    /// <summary>JSON snapshot of the row before the change (UPDATE/DELETE only).</summary>
    public string? OldValues { get; set; }

    /// <summary>JSON snapshot of the row after the change (INSERT/UPDATE only).</summary>
    public string? NewValues { get; set; }
}
