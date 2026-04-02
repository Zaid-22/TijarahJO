using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Api.Common.Configuration;
using TijarahJo.Api.Common.Utils;
using TijarahJo.Api.Contracts.Responses;

namespace TijarahJo.Api.Features.Search;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/search")]
public class SearchController : ControllerBase
{
    private readonly ISearchQueryHandler _searchQueries;
    private readonly IWebHostEnvironment _environment;
    private readonly FileStorageOptions _fileStorageOptions;

    public SearchController(
        ISearchQueryHandler searchQueries,
        IWebHostEnvironment environment,
        IOptions<FileStorageOptions> fileStorageOptions)
    {
        _searchQueries = searchQueries;
        _environment = environment;
        _fileStorageOptions = fileStorageOptions.Value;
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

        return Ok(DTOMapper.ToSearchResponseDTO(result.Result, _environment.ContentRootPath, _fileStorageOptions));
    }
}
