using System.ComponentModel.DataAnnotations;

namespace TijarahJo.Api.Contracts.Requests;

public class UpdatePostStatusRequest
{
    [Required(AllowEmptyStrings = false)]
    [RegularExpression(
        "^(?i)(ACTIVE|BLOCKED|SOLD)$",
        ErrorMessage = "Status must be one of: ACTIVE, BLOCKED, SOLD."
    )]
    public string Status { get; set; } = "ACTIVE"; // ACTIVE, BLOCKED, SOLD
}
