using System;

namespace TijarahJo.Domain.Models
{
	    public record CategoryModel
	    {
	        public CategoryModel(
	            int? categoryid,
	            string categoryname,
	            DateTime createdat,
	            bool isdeleted,
	            string? namear = null,
	            string? image = null)
	        {
	            this.CategoryID = categoryid;
	            this.CategoryName = categoryname;
	            this.CreatedAt = createdat;
	            this.IsDeleted = isdeleted;
	            this.NameAr = namear;
	            this.Image = image;
	        }

	        public int? CategoryID { get; init; }
	        public string CategoryName { get; init; }
	        public string? NameAr { get; init; }
	        public string? Image { get; init; }
	        public DateTime CreatedAt { get; init; }
	        public bool IsDeleted { get; init; }
	    }
}
