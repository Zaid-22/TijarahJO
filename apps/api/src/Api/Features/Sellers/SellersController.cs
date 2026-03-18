using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJo.Api.Common.Utils;
using TijarahJo.Api.Contracts.Requests;
using TijarahJo.Api.Contracts.Responses;

namespace TijarahJo.Api.Features.Sellers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/sellers")]
public class SellersController : ControllerBase
{
    private readonly ISellerQueryHandler _sellerQueries;

    public SellersController(ISellerQueryHandler sellerQueries)
    {
        _sellerQueries = sellerQueries;
    }

    [HttpGet("{sellerId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SellerProfileResponseDTO>> GetSellerProfile(string sellerId, CancellationToken cancellationToken)
    {
        SellerProfileResult result = await _sellerQueries.GetProfileAsync(new SellerProfileQuery { SellerId = sellerId }, cancellationToken);
        if (!result.Success || result.Profile == null)
        {
            return this.ToSellerProfileProblem(result, "Failed to fetch seller profile.");
        }

        return Ok(DTOMapper.ToSellerProfileResponseDTO(result.Profile));
    }

    [HttpGet("top")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IReadOnlyList<TopSellerResponseDTO>>> GetTopSellers([FromQuery] GetTopSellersRequest request, CancellationToken cancellationToken)
    {
        TopSellersResult result = await _sellerQueries.GetTopSellersAsync(request.Take, cancellationToken);
        if (!result.Success)
        {
            return this.ToTopSellersProblem(result, "Failed to fetch top sellers.");
        }

        IReadOnlyList<TopSellerResponseDTO> response = result.Sellers
            .Select(DTOMapper.ToTopSellerResponseDTO)
            .ToList();

        return Ok(response);
    }
}
