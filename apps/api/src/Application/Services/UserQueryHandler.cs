using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Common;

namespace TijarahJo.Application.Services;

public sealed class UserQueryHandler : IUserQueryHandler
{
    private readonly IUserDataAccess _users;

    public UserQueryHandler(IUserDataAccess users)
    {
        _users = users;
    }

    public async Task<UserListQueryResult> GetAllAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
    {
        IReadOnlyList<UserModel> users = await _users.GetAllUsersAsync(pageNumber, pageSize, cancellationToken);
        List<UserModel> copiedUsers = users.Select(CloneUserModel).ToList();

        return new UserListQueryResult
        {
            Success = true,
            StatusCode = 200,
            Users = copiedUsers
        };
    }

    public async Task<UserByIdQueryResult> GetByIdAsync(UserByIdQuery query, CancellationToken cancellationToken = default)
    {
        if (query.TargetUserId < 1)
        {
            return new UserByIdQueryResult
            {
                Success = false,
                StatusCode = 400,
                Message = $"Invalid user ID: {query.TargetUserId}"
            };
        }

        UserModel? user = await _users.GetUserByIDAsync(query.TargetUserId, cancellationToken);
        if (user == null)
        {
            return new UserByIdQueryResult
            {
                Success = false,
                StatusCode = 404,
                Message = $"User with ID {query.TargetUserId} not found."
            };
        }

        UserModel visibleUser = BuildVisibleUserModel(
            user,
            query.TargetUserId,
            query.RequesterUserId,
            query.RequesterIsAdmin
        );

        return new UserByIdQueryResult
        {
            Success = true,
            StatusCode = 200,
            User = visibleUser
        };
    }

    public async Task<UserExistsQueryResult> ExistsAsync(int userId, CancellationToken cancellationToken = default)
    {
        if (userId < 1)
        {
            return new UserExistsQueryResult
            {
                Success = false,
                StatusCode = 400,
                Message = $"Not accepted ID {userId}"
            };
        }

        bool exists = await _users.DoesUserExistAsync(userId, cancellationToken);
        return new UserExistsQueryResult
        {
            Success = true,
            StatusCode = 200,
            Exists = exists
        };
    }

    private static UserModel BuildVisibleUserModel(UserModel source, int targetUserId, int? requesterUserId, bool requesterIsAdmin)
    {
        UserModel clone = CloneUserModel(source);

        bool isSelfRequest = requesterUserId.HasValue && requesterUserId.Value == targetUserId;
        if (isSelfRequest || requesterIsAdmin)
        {
            return clone;
        }

        clone = clone with
        {
            Email = string.Empty,
            Phone = null,
            Bio = null,
            Status = 0,
            RoleID = 0,
            IsDeleted = false
        };
        return clone;
    }

    private static UserModel CloneUserModel(UserModel source)
    {
        return new UserModel(
            source.UserID,
            source.HashedPassword,
            source.Email,
            source.FirstName,
            source.LastName,
            source.Phone,
            source.CityId,
            source.AreaId,
            source.Bio,
            source.Avatar,
            source.JoinDate,
            source.Status,
            source.RoleID,
            source.IsDeleted,
            source.TwoFactorEnabled,
            source.TwoFactorSecret,
            source.TwoFactorPendingSecret
        );
    }
}
