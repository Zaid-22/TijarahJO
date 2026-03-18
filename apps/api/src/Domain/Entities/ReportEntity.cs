using System;

namespace TijarahJo.Domain.Entities;

/// <summary>
/// Represents a user-submitted abuse/fraud report against a listing, user, or review.
/// Workflow: Pending → UnderReview → Resolved / Dismissed.
/// </summary>
public sealed class ReportEntity
{
    [System.ComponentModel.DataAnnotations.Key]
    public int ReportID { get; set; }

    /// <summary>Type of report: "LISTING", "USER", "REVIEW", "CHAT".</summary>
    public string ReportType { get; set; } = string.Empty;

    /// <summary>ID of the reported entity (PostID, UserID, ReviewID, or ConversationID).</summary>
    public int TargetID { get; set; }

    /// <summary>Reason category: "SPAM", "SCAM", "OFFENSIVE", "FAKE", "HARASSMENT", "OTHER".</summary>
    public string Reason { get; set; } = string.Empty;

    /// <summary>Optional additional details from the reporter.</summary>
    public string? Description { get; set; }

    /// <summary>UserID of the person filing the report.</summary>
    public int ReporterUserID { get; set; }

    /// <summary>Status: 0=Pending, 1=UnderReview, 2=Resolved, 3=Dismissed.</summary>
    public int Status { get; set; }

    /// <summary>Admin UserID who resolved/dismissed the report. Null if still pending.</summary>
    public int? ResolvedByUserID { get; set; }

    /// <summary>Admin notes on the resolution.</summary>
    public string? ResolutionNotes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }

    // Navigation
    public UserEntity? Reporter { get; set; }
    public UserEntity? ResolvedBy { get; set; }
}
