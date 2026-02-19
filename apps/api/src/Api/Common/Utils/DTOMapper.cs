using Models;
using TijarahJoDBAPI.Contracts.Responses;

namespace TijarahJoDBAPI.Common.Utils;

public static class DTOMapper
{
    public static UserResponseDTO ToUserResponseDTO(UserModel userModel)
    {
        return new UserResponseDTO
        {
            UserID = userModel.UserID ?? 0,
            Id = userModel.UserID?.ToString() ?? "",
            Email = userModel.Email,
            FirstName = userModel.FirstName,
            LastName = userModel.LastName ?? "",
            Phone = userModel.Phone,
            City = userModel.City,
            Area = userModel.Area,
            Bio = userModel.Bio,
            Avatar = userModel.Avatar,
            JoinedDate = userModel.JoinDate,
            Status = userModel.Status,
            RoleID = userModel.RoleID, // Map RoleID
            IsDeleted = userModel.IsDeleted
        };
    }
}
