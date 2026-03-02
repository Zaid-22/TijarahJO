using static TijarahJoDBAPI.Common.Services.PostsFeedService;

namespace TijarahJoDBAPI.Common.Services;

/// <summary>
/// Abstraction for the posts feed service — enables mocking in tests.
/// </summary>
public interface IPostsFeedService
{
    NormalizedFeedRequest NormalizeRequest(int? page, int? limit, bool? includeDeleted);
    Task<FeedResponse> FetchPostsFeedAsync(NormalizedFeedRequest request, CancellationToken cancellationToken = default);
}
