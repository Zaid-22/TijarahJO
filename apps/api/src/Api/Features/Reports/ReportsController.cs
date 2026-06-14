using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TijarahJo.Api.Common.Services;
using TijarahJo.Api.Common.Utils;
using TijarahJo.Api.Contracts.Requests;
using TijarahJo.Domain.Entities;
using TijarahJo.Domain.Enums;
using TijarahJo.Infrastructure.Persistence;

namespace TijarahJo.Api.Features.Reports;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/reports")]
[Authorize]
public sealed class ReportsController(
    TijarahJoDbContext dbContext,
    IPostImageFileStorageService imageStorageService) : ControllerBase
{
    private readonly TijarahJoDbContext _dbContext = dbContext;
    private readonly IPostImageFileStorageService _imageStorageService = imageStorageService;

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult> CreateReport(
        [FromForm] CreateReportRequest request,
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
                report.Status == (int)ReportStatus.Pending,
            cancellationToken);
        if (duplicatePendingReportExists)
        {
            return Problem(statusCode: StatusCodes.Status409Conflict, detail: "You already submitted a pending report for this item.");
        }

        // Save optional evidence image — store the relative path only so the value
        // is environment-agnostic (works in dev, staging, and production without changes).
        string? imageUrl = null;
        if (request.Image is { Length: > 0 })
        {
            try
            {
                var storedImage = await _imageStorageService.SaveReportImageAsync(request.Image, cancellationToken);
                imageUrl = storedImage.PublicUrl; // e.g. /uploads/reports/abc.jpg
            }
            catch (ArgumentException ex)
            {
                return Problem(statusCode: StatusCodes.Status400BadRequest, detail: ex.Message);
            }
        }

        var reportEntity = new ReportEntity
        {
            ReportType = normalizedReportType,
            TargetID = request.TargetID,
            Reason = normalizedReason,
            Description = normalizedDescription,
            ImageUrl = imageUrl,
            ReporterUserID = currentUserId,
            Status = (int)ReportStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Reports.Add(reportEntity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return StatusCode(StatusCodes.Status201Created, new
        {
            Message = "Report submitted successfully.",
            reportEntity.ReportID
        });
    }

    private static bool IsSupportedReportType(string reportType) =>
        reportType is "LISTING" or "USER" or "REVIEW" or "COMMENT";

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
            "COMMENT" => await _dbContext.PostComments.AnyAsync(
                comment => comment.CommentID == targetId && !comment.IsDeleted,
                cancellationToken),
            _ => false
        };
    }
}
