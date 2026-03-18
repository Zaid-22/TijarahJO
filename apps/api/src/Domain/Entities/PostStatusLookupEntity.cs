namespace TijarahJo.Domain.Entities
{
    public sealed class PostStatusLookupEntity
    {
        public int StatusID { get; set; }
        public string Code { get; set; } = string.Empty;
        public string StatusName { get; set; } = string.Empty;
        public bool IsVisible { get; set; }
        public string? Description { get; set; }
    }
}
