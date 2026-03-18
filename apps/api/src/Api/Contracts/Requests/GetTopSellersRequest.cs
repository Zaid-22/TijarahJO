using System.ComponentModel.DataAnnotations;

namespace TijarahJo.Api.Contracts.Requests;

public sealed class GetTopSellersRequest
{
    [Range(1, 50)]
    public int Take { get; set; } = 10;
}
