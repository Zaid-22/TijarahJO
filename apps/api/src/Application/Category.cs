using TijarahJo.Domain.Models;

namespace TijarahJo.Application.Common
{
    public class Category
    {
        public enum ModeType
        {
            AddNew = 0,
            Update = 1
        }

        public ModeType Mode { get; set; } = ModeType.AddNew;

        public CategoryModel CategoryModel =>
            new(
                this.CategoryID,
                this.CategoryName,
                this.CreatedAt,
                this.IsDeleted,
                this.NameAr,
                this.Icon,
                this.Color,
                this.Image
            );

        public int? CategoryID { get; set; }
        public string CategoryName { get; set; }
        public string? NameAr { get; set; }
        public string? Icon { get; set; }
        public string? Color { get; set; }
        public string? Image { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsDeleted { get; set; }

        public Category(CategoryModel categoryModel, ModeType mode = ModeType.AddNew)
        {
            this.CategoryID = categoryModel.CategoryID;
            this.CategoryName = categoryModel.CategoryName;
            this.NameAr = categoryModel.NameAr;
            this.Icon = categoryModel.Icon;
            this.Color = categoryModel.Color;
            this.Image = categoryModel.Image;
            this.CreatedAt = categoryModel.CreatedAt;
            this.IsDeleted = categoryModel.IsDeleted;
            this.Mode = mode;
        }
    }
}
