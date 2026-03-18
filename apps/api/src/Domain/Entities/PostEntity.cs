using System;

namespace TijarahJo.Domain.Entities
{
    public sealed class PostEntity
    {
        public int PostID { get; set; }
        public int UserID { get; set; }
        public int CategoryID { get; set; }
        public string PostTitle { get; set; } = string.Empty;
        public string? PostDescription { get; set; }
        public decimal? Price { get; set; }
        public int Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsDeleted { get; set; }
        public long Views { get; set; }
        public int? CityID { get; set; }
        public int? AreaID { get; set; }

        public PostStatusLookupEntity? StatusLookup { get; set; }
        public string? SearchTitleNormalized { get; private set; }
        public string? SearchDescriptionPrefixNormalized { get; private set; }
    }
}
