namespace TijarahJoDBAPI.Contracts.Requests;

public class UpdatePostStatusRequest
{
    public string Status { get; set; } = "ACTIVE"; // ACTIVE, BLOCKED, DELETED, SOLD (INACTIVE accepted as alias)
}
