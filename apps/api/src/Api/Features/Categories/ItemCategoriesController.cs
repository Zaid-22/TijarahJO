using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Api.Common.Authorization;
using TijarahJo.Api.Common.Utils;
using TijarahJo.Api.Contracts.Requests;
using TijarahJo.Api.Contracts.Responses;
using TijarahJo.Api.Common.Services;

namespace TijarahJo.Api.Features.Categories;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/categories")]
public class ItemCategoriesController(ICategoryQueryHandler categoryQueries, ICategoryCommandService categoryCommands) : ControllerBase
{

    [HttpGet("")]
    [ResponseCache(Duration = 300)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<CategoryResponseDTO>>> GetAllCategories(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        CategoryListQueryResult result = await categoryQueries.GetAllAsync(page, pageSize, HttpContext.RequestAborted);
        if (!result.Success)
        {
            return this.ToCategoryListQueryProblem(result, "Failed to fetch categories.");
        }

        if (result.Categories.Count == 0)
        {
            return Ok(new List<CategoryResponseDTO>());
        }

        List<CategoryResponseDTO> dtoList = [.. result.Categories.Select(DTOMapper.ToCategoryResponseDTO)];

        return Ok(dtoList);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CategoryResponseDTO>> GetCategoryById(int id)
    {
        CategoryByIdQueryResult result = await categoryQueries.GetByIdAsync(id, HttpContext.RequestAborted);
        if (!result.Success || result.Category == null)
        {
            return this.ToCategoryByIdQueryProblem(result, "Failed to fetch category.");
        }

        return Ok(DTOMapper.ToCategoryResponseDTO(result.Category));
    }

    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CategoryResponseDTO>> AddCategory([FromBody] CreateCategoryRequest request)
    {
        CategoryCommandResult result = await categoryCommands.CreateAsync(
            new CreateCategoryCommand
            {
                CategoryName = request.CategoryName,
                NameAr = request.NameAr,
                Icon = request.Icon,
                Color = request.Color,
                Image = request.Image
            },
            HttpContext.RequestAborted
        );
        if (!result.Success || result.Category == null)
        {
            return this.ToCategoryCommandProblem(result, "Category operation failed.");
        }

        return CreatedAtAction(
            nameof(GetCategoryById),
            new { id = result.Category.CategoryID },
            DTOMapper.ToCategoryResponseDTO(result.Category.CategoryModel)
        );
    }

    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CategoryResponseDTO>> UpdateCategory(int id, [FromBody] UpdateCategoryRequest request)
    {
        CategoryCommandResult result = await categoryCommands.UpdateAsync(
            new UpdateCategoryCommand
            {
                CategoryId = id,
                CategoryName = request.CategoryName,
                NameAr = request.NameAr,
                Icon = request.Icon,
                Color = request.Color,
                Image = request.Image
            },
            HttpContext.RequestAborted
        );
        if (!result.Success || result.Category == null)
        {
            return this.ToCategoryCommandProblem(result, "Category operation failed.");
        }

        return Ok(DTOMapper.ToCategoryResponseDTO(result.Category.CategoryModel));
    }

    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    [HttpPost("upload-image")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> UploadCategoryImage(
        [FromForm] UploadCategoryImageRequest request,
        [FromServices] IPostImageFileStorageService storageService,
        CancellationToken cancellationToken)
    {
        IFormFile? file = request.File;
        if (file == null || file.Length == 0)
        {
            return BadRequest(new ApiMessageResponse { Message = "File is empty or not provided." });
        }
        
        try
        {
            var storedFile = await storageService.SaveAsync(file, cancellationToken);
            return Ok(new { Url = storedFile.PublicUrl });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ApiMessageResponse { Message = ex.Message });
        }
    }

    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteCategory(int id)
    {
        CategoryCommandResult result = await categoryCommands.DeleteAsync(id, HttpContext.RequestAborted);
        if (!result.Success)
        {
            return this.ToCategoryCommandProblem(result, "Category operation failed.");
        }

        return Ok(new ApiMessageResponse { Message = $"Category with ID {id} has been deleted." });
    }

    [HttpGet("Exists/{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<bool>> DoesCategoryExist(int id)
    {
        CategoryExistsQueryResult result = await categoryQueries.ExistsAsync(id, HttpContext.RequestAborted);
        if (!result.Success)
        {
            return this.ToCategoryExistsQueryProblem(result, "Failed to check category existence.");
        }

        return Ok(result.Exists);
    }
}
