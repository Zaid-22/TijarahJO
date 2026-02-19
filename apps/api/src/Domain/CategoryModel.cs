using System;

namespace Models
{
	    public class CategoryModel
	    {
	        public CategoryModel(
	            int? categoryid,
	            string categoryname,
	            DateTime createdat,
	            bool isdeleted,
	            string? namear = null,
	            string? icon = null,
	            string? color = null,
	            string? image = null)
	        {
	            this.CategoryID = categoryid;
	            this.CategoryName = categoryname;
	            this.CreatedAt = createdat;
	            this.IsDeleted = isdeleted;
	            this.NameAr = namear;
	            this.Icon = icon;
	            this.Color = color;
	            this.Image = image;
	        }

	        public int? CategoryID { get; set; }
	        public string CategoryName { get; set; }
	        public string? NameAr { get; set; }
	        public string? Icon { get; set; }
	        public string? Color { get; set; }
	        public string? Image { get; set; }
	        public DateTime CreatedAt { get; set; }
	        public bool IsDeleted { get; set; }
	    }
}
