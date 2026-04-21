using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Logging;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Api.Contracts.Requests;
using TijarahJo.Api.Contracts.Responses;

namespace TijarahJo.Api.Features.Compare
{
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/compare")]
    [Authorize]
    public class CompareController(
        ILogger<CompareController> logger,
        IPostCompareService compareService,
        ICompareVideoRecommendationService videoRecommendations) : ControllerBase
    {
        private readonly ILogger<CompareController> _logger = logger;
        private readonly IPostCompareService _compareService = compareService;
        private readonly ICompareVideoRecommendationService _videoRecommendations = videoRecommendations;

        [HttpPost]
        [EnableRateLimiting("compare")]
        [ProducesResponseType(typeof(CompareResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<CompareResponse>> ComparePosts(
            [FromBody] CompareRequest request,
            CancellationToken cancellationToken)
        {
            if (request?.PostIds == null || request.PostIds.Count < 2 || request.PostIds.Count > 3)
            {
                return Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    detail: "Please provide 2 or 3 post IDs for comparison.");
            }

            if (request.PostIds.Distinct().Count() < 2)
            {
                return Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    detail: "Post IDs must be unique.");
            }

            if (_logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation(
                    "User {UserId} comparing posts: {PostIds}",
                    User.FindFirstValue(ClaimTypes.NameIdentifier),
                    request.PostIds);
            }

            PostCompareResult result = await _compareService.CompareAsync(
                request.PostIds,
                request.Language,
                cancellationToken);

            if (!result.Success)
            {
                return result.FailureReason switch
                {
                    CompareFailureReason.PostNotFound => Problem(
                        statusCode: StatusCodes.Status404NotFound,
                        detail: result.Message),
                    CompareFailureReason.InvalidRequest => Problem(
                        statusCode: StatusCodes.Status400BadRequest,
                        detail: result.Message),
                    CompareFailureReason.RateLimited => Problem(
                        statusCode: StatusCodes.Status429TooManyRequests,
                        detail: result.Message),
                    _ => Problem(
                        statusCode: StatusCodes.Status500InternalServerError,
                        detail: result.Message ?? "An error occurred during comparison.")
                };
            }

            var response = new CompareResponse
            {
                Posts = [.. result.Posts.Select(p => new ComparePostDTO
                {
                    PostId = p.PostId,
                    Name = p.Name,
                    Price = p.Price,
                    Category = p.Category,
                    Description = p.Description,
                    ImageUrl = p.ImageUrl,
                    City = p.City,
                    Views = p.Views
                })],
                PriceComparison = result.PriceComparison,
                PostSummaries = [.. result.PostSummaries.Select(ps => new PostSummaryDTO
                {
                    PostName = ps.PostName,
                    Summary = ps.Summary
                })],
                FeatureDifferences = [.. result.FeatureDifferences.Select(fd => new PostFeaturesDTO
                {
                    PostName = fd.PostName,
                    Features = fd.Features
                })],
                ProsCons = [.. result.ProsCons.Select(pc => new PostProsConsDTO
                {
                    PostName = pc.PostName,
                    Pros = pc.Pros,
                    Cons = pc.Cons
                })],
                BestFor = result.BestFor != null
                    ? new BestForDTO
                    {
                        Budget = result.BestFor.Budget,
                        Performance = result.BestFor.Performance,
                        DailyUse = result.BestFor.DailyUse
                    }
                    : null,
                FinalRecommendation = result.FinalRecommendation != null
                    ? new FinalRecommendationDTO
                    {
                        WinnerName = result.FinalRecommendation.WinnerName,
                        BestFor = result.FinalRecommendation.BestFor,
                        Reason = result.FinalRecommendation.Reason
                    }
                    : null
            };

            return Ok(response);
        }

        [HttpPost("videos")]
        [EnableRateLimiting("compare")]
        [ProducesResponseType(typeof(CompareVideoRecommendationsResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
        public async Task<ActionResult<CompareVideoRecommendationsResponse>> RecommendVideos(
            [FromBody] CompareVideoRecommendationsRequest request,
            CancellationToken cancellationToken)
        {
            if (request?.PostIds == null || request.PostIds.Count == 0 || request.PostIds.Count > 3)
            {
                return Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    detail: "Please provide 1 to 3 posts for video recommendations.");
            }

            if (request.PostIds.Any(postId => postId < 1) || request.PostIds.Distinct().Count() != request.PostIds.Count)
            {
                return Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    detail: "Post IDs must be positive and unique.");
            }

            CompareVideoRecommendationResult result = await _videoRecommendations.RecommendAsync(
                request.PostIds,
                request.Language,
                cancellationToken);

            var response = new CompareVideoRecommendationsResponse
            {
                IsConfigured = result.IsConfigured,
                Message = result.Message,
                Videos = [.. result.Videos.Select(video => new CompareVideoRecommendationDTO
                {
                    PostId = video.PostId,
                    VideoId = video.VideoId,
                    Title = video.Title,
                    ChannelTitle = video.ChannelTitle,
                    ThumbnailUrl = video.ThumbnailUrl,
                    ViewCount = video.ViewCount,
                    PublishedAt = video.PublishedAt,
                    SearchQuery = video.SearchQuery
                })]
            };

            return Ok(response);
        }
    }
}
