using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using TijarahJo.Api.Common.Configuration;
using TijarahJo.Api.Contracts.Requests;
using TijarahJo.Api.Contracts.Responses;
using TijarahJo.Api.Features.Compare;
using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Api.Tests;

public sealed class CompareControllerTests
{
    [Fact]
    public async Task ComparePosts_ReturnsServiceUnavailable_WhenAiComparisonIsDisabled()
    {
        var compareService = new RecordingCompareService();
        var controller = new CompareController(
            NullLogger<CompareController>.Instance,
            compareService,
            new RecordingVideoRecommendationService(),
            new FeatureFlagsOptions { EnableAiComparison = false });

        ActionResult<CompareResponse> result = await controller.ComparePosts(
            new CompareRequest { PostIds = [1, 2], Language = "en" },
            CancellationToken.None);

        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status503ServiceUnavailable, objectResult.StatusCode);
        Assert.False(compareService.WasCalled);
    }

    [Fact]
    public async Task RecommendVideos_ReturnsServiceUnavailable_WhenAiComparisonIsDisabled()
    {
        var videoService = new RecordingVideoRecommendationService();
        var controller = new CompareController(
            NullLogger<CompareController>.Instance,
            new RecordingCompareService(),
            videoService,
            new FeatureFlagsOptions { EnableAiComparison = false });

        ActionResult<CompareVideoRecommendationsResponse> result = await controller.RecommendVideos(
            new CompareVideoRecommendationsRequest { PostIds = [1], Language = "en" },
            CancellationToken.None);

        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status503ServiceUnavailable, objectResult.StatusCode);
        Assert.False(videoService.WasCalled);
    }

    private sealed class RecordingCompareService : IPostCompareService
    {
        public bool WasCalled { get; private set; }

        public Task<PostCompareResult> CompareAsync(List<int> postIds, string language = "en", CancellationToken cancellationToken = default)
        {
            WasCalled = true;
            return Task.FromResult(new PostCompareResult { Success = true });
        }
    }

    private sealed class RecordingVideoRecommendationService : ICompareVideoRecommendationService
    {
        public bool WasCalled { get; private set; }

        public Task<CompareVideoRecommendationResult> RecommendAsync(IReadOnlyList<int> postIds, string language = "en", CancellationToken cancellationToken = default)
        {
            WasCalled = true;
            return Task.FromResult(new CompareVideoRecommendationResult { Success = true, IsConfigured = true });
        }
    }
}
