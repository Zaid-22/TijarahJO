using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TijarahJo.Api.Common.Utils;
using TijarahJo.Api.Contracts.Requests;
using TijarahJo.Domain.Entities;
using TijarahJo.Infrastructure.Persistence;

namespace TijarahJo.Api.Features.Reports;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/reports")]
[Authorize]
public sealed class ReportsController(TijarahJoDbContext dbContext) : ControllerBase
{
    private readonly TijarahJoDbContext _dbContext = dbContext;

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult> CreateReport(
        [FromBody] CreateReportRequest request,
        CancellationToken cancellationToken)
    {
        if (!ApiControllerHelpers.TryGetCurrentUserIdOrProblem(this, out int currentUserId, out ActionResult? failureResult))
        {
            return failureResult!;
        }

        string normalizedReportType = (request.ReportType ?? string.Empty).Trim().ToUpperInvariant();
        string normalizedReason = (request.Reason ?? string.Empty).Trim().ToUpperInvariant();
        string? normalizedDescription = string.IsNullOrWhiteSpace(request.Description)
            ? null
            : request.Description.Trim();

        if (!IsSupportedReportType(normalizedReportType))
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Unsupported report type.");
        }

        if (request.TargetID < 1)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Invalid report target.");
        }

        if (string.IsNullOrWhiteSpace(normalizedReason))
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "Report reason is required.");
        }

        bool targetExists = await TargetExistsAsync(normalizedReportType, request.TargetID, cancellationToken);
        if (!targetExists)
        {
            return Problem(statusCode: StatusCodes.Status404NotFound, detail: "Reported item was not found.");
        }

        bool duplicatePendingReportExists = await _dbContext.Reports.AnyAsync(
            report =>
                report.ReportType == normalizedReportType &&
                report.TargetID == request.TargetID &&
                report.ReporterUserID == currentUserId &&
                report.Status == 0,
            cancellationToken);
        if (duplicatePendingReportExists)
        {
            return Problem(statusCode: StatusCodes.Status409Conflict, detail: "You already submitted a pending report for this item.");
        }

        var reportEntity = new ReportEntity
        {
            ReportType = normalizedReportType,
            TargetID = request.TargetID,
            Reason = normalizedReason,
            Description = normalizedDescription,
            ReporterUserID = currentUserId,
            Status = 0,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Reports.Add(reportEntity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return StatusCode(StatusCodes.Status201Created, new
        {
            Message = "Report submitted successfully.",
            ReportID = reportEntity.ReportID
        });
    }

    private static bool IsSupportedReportType(string reportType) =>
        reportType is "LISTING" or "USER" or "REVIEW" or "CHAT";

    private async Task<bool> TargetExistsAsync(
        string reportType,
        int targetId,
        CancellationToken cancellationToken)
    {
        return reportType switch
        {
            "LISTING" => await _dbContext.Posts.AnyAsync(
                post => post.PostID == targetId && !post.IsDeleted,
                cancellationToken),
            "USER" => await _dbContext.Users.AnyAsync(
                user => user.UserID == targetId && !user.IsDeleted,
                cancellationToken),
            "REVIEW" => await _dbContext.Reviews.AnyAsync(
                review => review.ReviewID == targetId && !review.IsDeleted,
                cancellationToken),
            "CHAT" => await _dbContext.Conversations.AnyAsync(
                conversation => conversation.ConversationID == targetId && !conversation.IsDeleted,
                cancellationToken),
            _ => false
        };
    }
}
