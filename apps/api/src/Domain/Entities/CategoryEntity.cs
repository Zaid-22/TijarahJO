using System;

namespace TijarahJo.Domain.Entities
{
    public sealed class CategoryEntity
    {
        public int CategoryID { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string? NameAr { get; set; }
        public string? Image { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsDeleted { get; set; }
        
        public string? SearchCategoryNameNormalized { get; private set; }
    }
}
