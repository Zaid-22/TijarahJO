namespace TijarahJo.Api.Contracts.Responses;

public class UserAvatarUploadResponseDTO
{
    public string AvatarUrl { get; set; } = string.Empty;
    public UserResponseDTO User { get; set; } = default!;
}
