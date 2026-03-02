
namespace TijarahJoDBAPI.Contracts.Requests;
public class GetPaginatedRequest
{
	public int PageNumber { get; set; } = 1;
	public int RowsPerPage { get; set; } = 10;
	public bool IncludeDeleted { get; set; } = false;
}
