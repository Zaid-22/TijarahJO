using TijarahJo.Domain.Entities;
using TijarahJo.Domain.Enums;
using TijarahJo.Infrastructure.DataAccess;

namespace TijarahJo.Api.Tests;

public sealed class AdminReportStatusTests
{
    [Fact]
    public void ApplyReportStatus_ReopenClearsResolutionMetadata()
    {
        var report = new ReportEntity
        {
            Status = (int)ReportStatus.Resolved,
            ResolvedByUserID = 44,
            ResolvedAt = new DateTime(2026, 8, 8, 10, 0, 0, DateTimeKind.Utc),
            ResolutionNotes = "previous resolution"
        };

        AdminDataAccessAdapter.ApplyReportStatus(
            report,
            (int)ReportStatus.UnderReview,
            adminUserId: 51,
            resolutionNotes: "must not survive reopening",
            utcNow: new DateTime(2026, 8, 9, 10, 0, 0, DateTimeKind.Utc));

        Assert.Equal((int)ReportStatus.UnderReview, report.Status);
        Assert.Null(report.ResolvedByUserID);
        Assert.Null(report.ResolvedAt);
        Assert.Null(report.ResolutionNotes);
    }

    [Fact]
    public void ApplyReportStatus_TerminalStateRecordsTrimmedResolutionMetadata()
    {
        var report = new ReportEntity();
        var resolvedAt = new DateTime(2026, 8, 9, 10, 0, 0, DateTimeKind.Utc);

        AdminDataAccessAdapter.ApplyReportStatus(
            report,
            (int)ReportStatus.Dismissed,
            adminUserId: 51,
            resolutionNotes: "  duplicate report  ",
            utcNow: resolvedAt);

        Assert.Equal(51, report.ResolvedByUserID);
        Assert.Equal(resolvedAt, report.ResolvedAt);
        Assert.Equal("duplicate report", report.ResolutionNotes);
    }

    [Fact]
    public void ApplyReportStatus_RejectsUndefinedStatus()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            AdminDataAccessAdapter.ApplyReportStatus(
                new ReportEntity(),
                newStatus: 99,
                adminUserId: 51,
                resolutionNotes: null,
                utcNow: DateTime.UtcNow));
    }
}
