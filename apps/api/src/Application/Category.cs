using TijarahJo.Domain.Models;

namespace TijarahJo.Application;

public class Category(CategoryModel categoryModel, Category.ModeType mode = Category.ModeType.AddNew)
{
    public enum ModeType
    {
        AddNew = 0,
        Update = 1
    }

    public ModeType Mode { get; set; } = mode;

    public CategoryModel CategoryModel =>
        new(
            this.CategoryID,
            this.CategoryName,
            this.CreatedAt,
            this.IsDeleted,
            this.NameAr,
            this.Image
        );

    public int? CategoryID { get; set; } = categoryModel.CategoryID;
    public string CategoryName { get; set; } = categoryModel.CategoryName;
    public string? NameAr { get; set; } = categoryModel.NameAr;
    public string? Image { get; set; } = categoryModel.Image;
    public DateTime CreatedAt { get; set; } = categoryModel.CreatedAt;
    public bool IsDeleted { get; set; } = categoryModel.IsDeleted;
}
