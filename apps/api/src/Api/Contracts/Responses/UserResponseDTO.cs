namespace TijarahJoDBAPI.Contracts.Responses;

public class UserResponseDTO
{
    public int UserID { get; set; } // Backward compatibility with existing consumers
    public string Id { get; set; } = string.Empty; // Converted from UserID (int)
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? City { get; set; }
    public string? Area { get; set; }
    public string? Bio { get; set; }
    public string? Avatar { get; set; }
    public DateTime JoinedDate { get; set; } // DateTime format
    public DateTime JoinDate => JoinedDate; // Backward compatibility alias
    public int Status { get; set; }
    public int RoleID { get; set; } // Added RoleID (1=Admin, 2=User)
    public bool IsDeleted { get; set; }
    public string Name => $"{FirstName} {LastName}".Trim(); // Computed property
}
