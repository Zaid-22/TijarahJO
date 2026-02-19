using Microsoft.AspNetCore.Mvc;
using TijarahJoDB.Application.Abstractions.Services;

namespace TijarahJoDBAPI.Features.Search;

[ApiController]
[Route("api/search")]
public class SearchController : ControllerBase
{
    private readonly ILogger<SearchController> _logger;
    private readonly IWebHostEnvironment _environment;
    private readonly ISearchReadService _search;

    public SearchController(
        ILogger<SearchController> logger,
        IWebHostEnvironment environment,
        ISearchReadService search)
    {
        _logger = logger;
        _environment = environment;
        _search = search;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public ActionResult Search([FromQuery] SearchQueryRequestModel query)
    {
        try
        {
            SearchResult result = _search.Search(query);

            return Ok(new
            {
                success = result.Success,
                posts = result.Posts.Select(post => new
                {
                    id = post.Id,
                    name = post.Name,
                    price = post.Price,
                    location = post.Location,
                    area = post.Area,
                    seller = post.Seller,
                    sellerId = post.SellerId,
                    category = post.Category,
                    categoryId = post.CategoryId,
                    image = post.Image,
                    images = post.Images,
                    phone = post.Phone,
                    description = post.Description,
                    createdAt = post.CreatedAt,
                    updatedAt = post.UpdatedAt,
                    views = post.Views,
                    status = post.Status
                }),
                pagination = new
                {
                    currentPage = result.Pagination.CurrentPage,
                    totalPages = result.Pagination.TotalPages,
                    totalPosts = result.Pagination.TotalPosts,
                    postsPerPage = result.Pagination.PostsPerPage
                }
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Search request failed. query={Query}, category={Category}, city={City}, page={Page}, limit={Limit}",
                query.Query,
                query.Category,
                query.City,
                query.Page,
                query.Limit
            );

            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                success = false,
                message = "Search request failed.",
                traceId = HttpContext.TraceIdentifier,
                detail = _environment.IsDevelopment() ? ex.Message : null
            });
        }
    }
}
