namespace TijarahJo.Domain.Entities;

public sealed class AreaEntity
{
    public int AreaID { get; set; }
    public int CityID { get; set; }
    public string AreaName { get; set; } = string.Empty;

    // Navigation
    public CityEntity? City { get; set; }
}
