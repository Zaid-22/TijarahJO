using Microsoft.AspNetCore.Mvc;
using Models;
using System.Collections.Generic;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.BLL;
using Microsoft.AspNetCore.Authorization;

namespace TijarahJoDBAPI.Features.Categories
{
	[ApiController]
	[Route("api/categories")] // Primary route for frontend compatibility
	public class ItemCategoriesController : ControllerBase
	{
		private readonly ICategoryService _categories;
		private static readonly DateTime SqlDateTimeMinUtc = new DateTime(1753, 1, 1, 0, 0, 0, DateTimeKind.Utc);

		public ItemCategoriesController(ICategoryService categories)
		{
			_categories = categories;
		}

		private static DateTime NormalizeSqlDateTime(DateTime value, DateTime? fallback = null)
		{
			if (value == default || value < SqlDateTimeMinUtc)
			{
				return fallback ?? DateTime.UtcNow;
			}

			return value.Kind switch
			{
				DateTimeKind.Utc => value,
				DateTimeKind.Local => value.ToUniversalTime(),
				_ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
			};
		}

		private static string? NormalizeOptionalText(string? value)
		{
			if (string.IsNullOrWhiteSpace(value))
			{
				return null;
			}

			return value.Trim();
		}

			[HttpGet("", Name = "GetAllCategories")]
			[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public ActionResult<IEnumerable<CategoryModel>> GetAllCategories()
		{
			var categories = _categories.GetAllCategories();

			if (categories == null || categories.Count == 0)
			{
				return Ok(new List<CategoryModel>()); // Return empty list instead of 404
			}

			var dtoList = categories
				.Where(category => !category.IsDeleted && !string.IsNullOrWhiteSpace(category.CategoryName))
				.ToList();

			return Ok(dtoList);
		}

		[HttpGet("{id}", Name = "GetCategoryById")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public ActionResult<CategoryModel> GetCategoryById(int id)
		{
			if (id < 1)
			{
				return BadRequest($"Not accepted ID {id}");
			}

			Category? category = _categories.Find(id);

			if (category == null)
			{
				return NotFound($"Category with ID {id} not found.");
			}

			CategoryModel dto = category.CategoryModel;

			return Ok(dto);
		}

		[Authorize(Roles = "1")]
		[HttpPost(Name = "AddCategory")]
		[ProducesResponseType(StatusCodes.Status201Created)]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		public ActionResult<CategoryModel> AddCategory(CategoryModel newCategoryDTO)
		{
			if (newCategoryDTO == null || string.IsNullOrWhiteSpace(newCategoryDTO.CategoryName))
			{
				return BadRequest("Invalid Category data.");
			}

				newCategoryDTO.CategoryName = newCategoryDTO.CategoryName.Trim();
				newCategoryDTO.NameAr = NormalizeOptionalText(newCategoryDTO.NameAr);
				newCategoryDTO.Icon = NormalizeOptionalText(newCategoryDTO.Icon);
				newCategoryDTO.Color = NormalizeOptionalText(newCategoryDTO.Color);
				newCategoryDTO.Image = NormalizeOptionalText(newCategoryDTO.Image);
				newCategoryDTO.CreatedAt = NormalizeSqlDateTime(newCategoryDTO.CreatedAt);
				newCategoryDTO.IsDeleted = false;

				Category category = _categories.Create(new CategoryModel
				(
						newCategoryDTO.CategoryID,
						newCategoryDTO.CategoryName,
						newCategoryDTO.CreatedAt,
						newCategoryDTO.IsDeleted,
						newCategoryDTO.NameAr,
						newCategoryDTO.Icon,
						newCategoryDTO.Color,
						newCategoryDTO.Image
				));

			if (!_categories.Save(category))
			{
				return StatusCode(StatusCodes.Status500InternalServerError, "Error adding Category");
			}

			newCategoryDTO.CategoryID = category.CategoryID;

			return CreatedAtAction(nameof(GetCategoryById), new { id = newCategoryDTO.CategoryID }, newCategoryDTO);
		}

		[Authorize(Roles = "1")]
		[HttpPut("{id}", Name = "UpdateCategory")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public ActionResult<CategoryModel> UpdateCategory(int id, CategoryModel updatedCategory)
		{
			if (id < 1 || updatedCategory == null || string.IsNullOrWhiteSpace(updatedCategory.CategoryName))
			{
				return BadRequest("Invalid Category data.");
			}

			Category? category = _categories.Find(id);

			if (category == null)
			{
				return NotFound($"Category with ID {id} not found.");
			}

				category.CategoryName = updatedCategory.CategoryName.Trim();
				if (updatedCategory.NameAr != null)
				{
					category.NameAr = NormalizeOptionalText(updatedCategory.NameAr);
				}

				if (updatedCategory.Icon != null)
				{
					category.Icon = NormalizeOptionalText(updatedCategory.Icon);
				}

				if (updatedCategory.Color != null)
				{
					category.Color = NormalizeOptionalText(updatedCategory.Color);
				}

				if (updatedCategory.Image != null)
				{
					category.Image = NormalizeOptionalText(updatedCategory.Image);
				}
				// Preserve immutable/system fields to avoid accidental invalid timestamps from partial client payloads.
				category.CreatedAt = NormalizeSqlDateTime(category.CreatedAt, DateTime.UtcNow);

			if (!_categories.Save(category))
			{
				return StatusCode(StatusCodes.Status500InternalServerError, "Error updating Category");
			}

			return Ok(category.CategoryModel);
		}

		[Authorize(Roles = "1")]
		[HttpDelete("{id}", Name = "DeleteCategory")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public ActionResult DeleteCategory(int id)
		{
			if (id < 1)
			{
				return BadRequest($"Not accepted ID {id}");
			}

			if (_categories.DeleteCategory(id))
			{
				return Ok($"Category with ID {id} has been deleted.");
			}
			else
			{
				return NotFound($"Category with ID {id} not found. No rows deleted!");
			}
		}

		[HttpGet("Exists/{id}", Name = "DoesCategoryExist")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest)]
		public ActionResult<bool> DoesCategoryExist(int id)
		{
			if (id < 1)
			{
				return BadRequest($"Not accepted ID {id}");
			}

			bool exists = _categories.DoesCategoryExist(id);

			return Ok(exists);
		}
	}
}
