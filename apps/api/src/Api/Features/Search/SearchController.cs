using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDBAPI.Common.Utils;
using TijarahJoDBAPI.Contracts.Responses;

namespace TijarahJoDBAPI.Features.Search;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/search")]
public class SearchController : ControllerBase
{
    private readonly ISearchQueryHandler _searchQueries;

    public SearchController(ISearchQueryHandler searchQueries)
    {
        _searchQueries = searchQueries;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<SearchResponseDTO>> Search([FromQuery] SearchRequestQuery request, CancellationToken cancellationToken)
    {
        SearchQueryResult result = await _searchQueries.SearchAsync(request, cancellationToken);
        if (!result.Success || result.Result == null)
        {
            return this.ToSearchQueryProblem(result, "Search request failed.");
        }

        return Ok(DTOMapper.ToSearchResponseDTO(result.Result));
    }
}
