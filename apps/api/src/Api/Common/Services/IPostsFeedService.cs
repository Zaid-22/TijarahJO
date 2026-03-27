using static TijarahJo.Api.Common.Services.PostsFeedService;

namespace TijarahJo.Api.Common.Services;

/// <summary>
/// Abstraction for the posts feed service — enables mocking in tests.
/// </summary>
public interface IPostsFeedService
{
    NormalizedFeedRequest NormalizeRequest(int? page, int? limit);
    Task<FeedResponse> FetchPostsFeedAsync(NormalizedFeedRequest request, CancellationToken cancellationToken = default);
}
