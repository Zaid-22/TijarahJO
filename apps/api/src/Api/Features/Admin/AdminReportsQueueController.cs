using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Api.Common.Authorization;
using TijarahJo.Api.Common.Configuration;
using TijarahJo.Api.Common.Services;
using TijarahJo.Infrastructure.Persistence;
using System.Security.Claims;

namespace TijarahJo.Api.Features.Admin;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/admin/reports")]
public class AdminReportsQueueController(
    IAdminReportDataAccess reportDataAccess,
    TijarahJoDbContext dbContext,
    IWebHostEnvironment environment,
    IOptions<FileStorageOptions> fileStorageOptions) : ControllerBase
{
    private readonly IAdminReportDataAccess _adminDataAccess = reportDataAccess;
    private readonly TijarahJoDbContext _dbContext = dbContext;
    private readonly IWebHostEnvironment _environment = environment;
    private readonly FileStorageOptions _fileStorageOptions = fileStorageOptions.Value;
    private static readonly FileExtensionContentTypeProvider ContentTypeProvider = new();

    [HttpGet]
    [Authorize(Policy = AuthorizationPolicies.ReportsView)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> GetReports(
        [FromQuery] int? status = null,
        [FromQuery] string? reportType = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var result = await _adminDataAccess.GetReportsAsync(status, reportType, search, page, pageSize, HttpContext.RequestAborted);
        foreach (var report in result.Reports.Where(report => !string.IsNullOrWhiteSpace(report.ImageUrl)))
        {
            report.ImageUrl = $"/api/v1/admin/reports/{report.ReportID}/image";
        }
        return Ok(result);
    }

    [HttpGet("{id:int}/image")]
    [Authorize(Policy = AuthorizationPolicies.ReportsView)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadReportImage(int id, CancellationToken cancellationToken)
    {
        if (id < 1) return NotFound();

        string? imageUrl = await _dbContext.Reports
            .AsNoTracking()
            .Where(report => report.ReportID == id)
            .Select(report => report.ImageUrl)
            .SingleOrDefaultAsync(cancellationToken);
        bool isPrivateImage = !string.IsNullOrWhiteSpace(imageUrl) &&
            imageUrl.StartsWith(
                LocalPostImageFileStorageService.NormalizeRequestPath(_fileStorageOptions.PrivateBasePath),
                StringComparison.OrdinalIgnoreCase);
        bool filePathResolved = isPrivateImage
            ? LocalPostImageFileStorageService.TryResolveAbsolutePrivateStoredFilePath(
                imageUrl!, _environment.ContentRootPath, _fileStorageOptions, out string filePath)
            : LocalPostImageFileStorageService.TryResolveAbsoluteStoredFilePath(
                imageUrl ?? string.Empty, _environment.ContentRootPath, _fileStorageOptions, out filePath);
        string reportRoot = isPrivateImage
            ? LocalPostImageFileStorageService.ResolveAbsolutePrivateReportImagesRootPath(
                _environment.ContentRootPath, _fileStorageOptions)
            : LocalPostImageFileStorageService.ResolveAbsoluteReportImagesRootPath(
                _environment.ContentRootPath, _fileStorageOptions);
        string relativeToReportRoot = filePathResolved
            ? Path.GetRelativePath(reportRoot, filePath)
            : "..";
        if (!filePathResolved ||
            Path.IsPathRooted(relativeToReportRoot) ||
            relativeToReportRoot.StartsWith("..", OperatingSystem.IsWindows() ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal) ||
            !System.IO.File.Exists(filePath))
        {
            return NotFound();
        }

        string contentType = ContentTypeProvider.TryGetContentType(filePath, out string? resolvedContentType)
            ? resolvedContentType
            : "application/octet-stream";
        Response.Headers.CacheControl = "private, max-age=300";
        return PhysicalFile(filePath, contentType);
    }

    [HttpPut("{id}/status")]
    [Authorize(Policy = AuthorizationPolicies.ReportsResolve)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> UpdateReportStatus(int id, [FromBody] UpdateReportStatusRequest request)
    {
        var adminUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

        bool updated = await _adminDataAccess.UpdateReportStatusAsync(
            id,
            request.Status,
            adminUserId,
            request.ResolutionNotes,
            HttpContext.RequestAborted);

        if (!updated) return NotFound();
        return Ok(new { Message = "Report status updated." });
    }
}

public sealed class UpdateReportStatusRequest
{
    public int Status { get; set; }
    public string? ResolutionNotes { get; set; }
}
