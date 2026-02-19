using Microsoft.AspNetCore.Mvc;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDBAPI.Common.Services;

namespace TijarahJoDBAPI.Features.Posts
{
	[ApiController]
	[Route("api/posts")] // Primary route for frontend compatibility
	public partial class UserPostsController : ControllerBase
	{
		private readonly ILogger<UserPostsController> _logger;
		private readonly PostsFeedService _postsFeedService;
		private readonly IPostService _posts;

		public UserPostsController(
			ILogger<UserPostsController> logger,
			PostsFeedService postsFeedService,
			IPostService posts
		)
		{
			_logger = logger;
			_postsFeedService = postsFeedService;
			_posts = posts;
		}

		public sealed class PostsFeedRequest
		{
			public int? Page { get; set; } = 1;
			public int? Limit { get; set; } = 20;
			public bool? IncludeDeleted { get; set; } = false;
		}
	}
}
