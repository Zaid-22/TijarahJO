namespace TijarahJo.Domain.Entities;

public sealed class CityEntity
{
    public int CityID { get; set; }
    public string CityName { get; set; } = string.Empty;
    public string CityNameAr { get; set; } = string.Empty;

    // Navigation
    public ICollection<AreaEntity> Areas { get; set; } = new List<AreaEntity>();
}
