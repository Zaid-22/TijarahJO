using System;

namespace TijarahJoDB.DAL.Entities
{
    public sealed class CategoryEntity
    {
        public int CategoryID { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string? NameAr { get; set; }
        public string? Icon { get; set; }
        public string? Color { get; set; }
        public string? Image { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsDeleted { get; set; }
        
        public string? SearchCategoryNameNormalized { get; private set; }
    }
}
