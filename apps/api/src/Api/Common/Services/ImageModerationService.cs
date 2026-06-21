using System;
using System.Threading.Tasks;
using Google.Cloud.Vision.V1;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TijarahJo.Api.Common.Configuration;

namespace TijarahJo.Api.Common.Services;

public interface IImageModerationService
{
    Task<ModerationResult> CheckImageAsync(IFormFile file);
}

public class ImageModerationService : IImageModerationService
{
    private readonly ILogger<ImageModerationService> _logger;
    private readonly IWebHostEnvironment _environment;
    private readonly ImageModerationOptions _options;
    private readonly Lazy<ImageAnnotatorClient> _client;
    private int _disabledLogged;

    public ImageModerationService(
        ILogger<ImageModerationService> logger,
        IWebHostEnvironment environment,
        IOptions<ImageModerationOptions> options)
    {
        _logger = logger;
        _environment = environment;
        _options = options.Value;
        // The API automatically picks up Application Default Credentials (ADC) from the environment.
        _client = new Lazy<ImageAnnotatorClient>(() =>
        {
            try 
            {
                return ImageAnnotatorClient.Create();
            } 
            catch (Exception ex) 
            {
                _logger.LogWarning(ex, "Failed to initialize Cloud Vision client. Check your Application Default Credentials.");
                return null!;
            }
        });
    }

    public async Task<ModerationResult> CheckImageAsync(IFormFile file)
    {
        if (!_options.Enabled)
        {
            if (Interlocked.Exchange(ref _disabledLogged, 1) == 0)
            {
                _logger.LogWarning("Image moderation is disabled (ImageModeration__Enabled=false). Uploads will not be screened.");
            }

            return new ModerationResult();
        }

        if (_client.Value == null) 
        {
            _logger.LogWarning("Cloud Vision client not available. {Mode}", _environment.IsDevelopment()
                ? "Allowing upload in development without moderation."
                : "Rejecting upload because moderation is required.");
            return BuildUnavailableResult();
        }

        try
        {
            using var stream = file.OpenReadStream();
            var image = await Image.FromStreamAsync(stream);
            
            var response = await _client.Value.DetectSafeSearchAsync(image);

            // Only block on explicit adult or graphic violence content at VeryLikely confidence.
            //
            // Threshold rationale for a general marketplace (electronics, clothing, phones, etc.):
            //   - Adult/Violence: VeryLikely only. "Likely" is too aggressive — normal product
            //     photos (skin, hands, faces) frequently score "Likely" on Adult or Medical.
            //   - Medical: NOT used for blocking. Medical likelihood fires on any photo showing
            //     skin, hands, or faces, which are common in legitimate product listings.
            //   - Spoof: NOT used for blocking. Screenshots and edited marketing images of
            //     products legitimately score high on Spoof. Blocking them harms real sellers.
            var result = new ModerationResult
            {
                IsAdult   = response.Adult    >= Likelihood.VeryLikely,
                IsViolent = response.Violence >= Likelihood.VeryLikely,
                // Kept for logging/diagnostics only — never used to block uploads:
                IsMedical = response.Medical  >= Likelihood.VeryLikely,
                IsSpoof   = response.Spoof    >= Likelihood.VeryLikely,
                RawAdult    = response.Adult.ToString(),
                RawViolence = response.Violence.ToString(),
                RawMedical  = response.Medical.ToString(),
                RawSpoof    = response.Spoof.ToString(),
            };

            if (result.IsFlagged)
            {
                _logger.LogWarning(
                    "Image moderation flagged upload. Adult={Adult}, Violence={Violence}, Medical={Medical}, Spoof={Spoof}",
                    result.RawAdult, result.RawViolence, result.RawMedical, result.RawSpoof);
            }
            else if (result.IsMedical || result.IsSpoof)
            {
                // Log for diagnostics but do NOT block — these are expected on marketplace listings.
                _logger.LogInformation(
                    "Image passed moderation (Medical/Spoof flagged but not blocking). Medical={Medical}, Spoof={Spoof}",
                    result.RawMedical, result.RawSpoof);
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during image moderation");
            return BuildUnavailableResult();
        }
    }

    private ModerationResult BuildUnavailableResult()
    {
        bool isDevelopment = _environment.IsDevelopment();

        return new ModerationResult
        {
            IsAdult     = false,
            IsViolent   = false,
            IsMedical   = false,
            IsSpoof     = false,
            IsUnavailable = !isDevelopment,
            FailureReason = isDevelopment
                ? null
                : "Image moderation service is unavailable."
        };
    }
}

public class ModerationResult
{
    public bool IsAdult    { get; set; }
    public bool IsViolent  { get; set; }
    /// <summary>Logged for diagnostics only. Never used to block marketplace uploads.</summary>
    public bool IsMedical  { get; set; }
    /// <summary>Logged for diagnostics only. Never used to block marketplace uploads.</summary>
    public bool IsSpoof    { get; set; }
    public string RawAdult    { get; set; } = "";
    public string RawViolence { get; set; } = "";
    public string RawMedical  { get; set; } = "";
    public string RawSpoof    { get; set; } = "";
    public bool IsUnavailable { get; set; }
    public string? FailureReason { get; set; }

    // Only Adult and Violence block uploads — Medical and Spoof are diagnostic only.
    public bool IsFlagged => IsAdult || IsViolent;
}

