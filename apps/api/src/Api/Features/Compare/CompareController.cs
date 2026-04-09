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
        IProductCompareService compareService) : ControllerBase
    {
        private readonly ILogger<CompareController> _logger = logger;
        private readonly IProductCompareService _compareService = compareService;

        [HttpPost]
        [EnableRateLimiting("compare")]
        [ProducesResponseType(typeof(CompareResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<CompareResponse>> CompareProducts(
            [FromBody] CompareRequest request,
            CancellationToken cancellationToken)
        {
            if (request?.ProductIds == null || request.ProductIds.Count < 2 || request.ProductIds.Count > 3)
            {
                return Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    detail: "Please provide 2 or 3 product IDs for comparison.");
            }

            if (request.ProductIds.Distinct().Count() < 2)
            {
                return Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    detail: "Product IDs must be unique.");
            }

            if (_logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation(
                    "User {UserId} comparing products: {ProductIds}",
                    User.FindFirstValue(ClaimTypes.NameIdentifier),
                    request.ProductIds);
            }

            ProductCompareResult result = await _compareService.CompareAsync(
                request.ProductIds,
                cancellationToken);

            if (!result.Success)
            {
                return result.FailureReason switch
                {
                    CompareFailureReason.ProductNotFound => Problem(
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
                Products = [.. result.Products.Select(p => new CompareProductDTO
                {
                    ProductId = p.ProductId,
                    Name = p.Name,
                    Price = p.Price,
                    Category = p.Category,
                    Description = p.Description,
                    ImageUrl = p.ImageUrl,
                    City = p.City,
                    Views = p.Views
                })],
                PriceComparison = result.PriceComparison,
                FeatureDifferences = [.. result.FeatureDifferences.Select(fd => new ProductFeaturesDTO
                {
                    ProductName = fd.ProductName,
                    Features = fd.Features
                })],
                ProsCons = [.. result.ProsCons.Select(pc => new ProductProsConsDTO
                {
                    ProductName = pc.ProductName,
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
                FinalRecommendation = result.FinalRecommendation
            };

            return Ok(response);
        }
    }
}
