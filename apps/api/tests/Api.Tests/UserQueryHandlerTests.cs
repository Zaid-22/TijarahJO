using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Services;
using TijarahJo.Application.Common;

namespace TijarahJo.Api.Tests;

public sealed class UserQueryHandlerTests
{
    [Fact]
    public async Task GetByIdAsync_ReturnsBadRequest_WhenIdIsInvalid()
    {
        var users = new FakeUserDataAccess();
        var handler = new UserQueryHandler(users);

        UserByIdQueryResult result = await handler.GetByIdAsync(new UserByIdQuery
        {
            TargetUserId = 0,
            RequesterUserId = null,
            RequesterIsAdmin = false
        });

        Assert.False(result.Success);
        Assert.Equal(400, result.StatusCode);
        Assert.Equal("Invalid user ID: 0", result.Message);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNotFound_WhenUserMissing()
    {
        var users = new FakeUserDataAccess { NextFindUser = null };
        var handler = new UserQueryHandler(users);

        UserByIdQueryResult result = await handler.GetByIdAsync(new UserByIdQuery
        {
            TargetUserId = 42,
            RequesterUserId = 7,
            RequesterIsAdmin = false
        });

        Assert.False(result.Success);
        Assert.Equal(404, result.StatusCode);
        Assert.Equal("User with ID 42 not found.", result.Message);
    }

    [Fact]
    public async Task GetByIdAsync_RedactsSensitiveFields_ForNonOwnerNonAdmin()
    {
        var users = new FakeUserDataAccess
        {
            NextFindUser = CreateUserModel(userId: 8)
        };
        var handler = new UserQueryHandler(users);

        UserByIdQueryResult result = await handler.GetByIdAsync(new UserByIdQuery
        {
            TargetUserId = 8,
            RequesterUserId = 9,
            RequesterIsAdmin = false
        });

        Assert.True(result.Success);
        Assert.NotNull(result.User);
        Assert.Equal(string.Empty, result.User!.Email);
        Assert.Equal(0, result.User.Status);
        Assert.Equal(0, result.User.RoleID);
        Assert.False(result.User.IsDeleted);
    }

    [Fact]
    public async Task GetByIdAsync_RedactsPrivateFields_ButKeepsPublicAvatar_ForNonOwnerNonAdmin()
    {
        var users = new FakeUserDataAccess
        {
            NextFindUser = CreateUserModel(userId: 15)
        };
        var handler = new UserQueryHandler(users);

        UserByIdQueryResult result = await handler.GetByIdAsync(new UserByIdQuery
        {
            TargetUserId = 15,
            RequesterUserId = null,
            RequesterIsAdmin = false
        });

        Assert.True(result.Success);
        Assert.NotNull(result.User);
        Assert.Null(result.User!.Phone);
        Assert.Null(result.User.Bio);
        Assert.Equal("avatar.png", result.User.Avatar);
    }

    [Fact]
    public async Task GetByIdAsync_KeepsSensitiveFields_ForSelfOrAdmin()
    {
        var model = CreateUserModel(userId: 12);
        var users = new FakeUserDataAccess
        {
            NextFindUser = model
        };
        var handler = new UserQueryHandler(users);

        UserByIdQueryResult selfResult = await handler.GetByIdAsync(new UserByIdQuery
        {
            TargetUserId = 12,
            RequesterUserId = 12,
            RequesterIsAdmin = false
        });

        Assert.True(selfResult.Success);
        Assert.NotNull(selfResult.User);
        Assert.Equal(model.Email, selfResult.User!.Email);
        Assert.Equal(model.Status, selfResult.User.Status);
        Assert.Equal(model.RoleID, selfResult.User.RoleID);
        Assert.Equal(model.IsDeleted, selfResult.User.IsDeleted);
    }

    [Fact]
    public async Task ExistsAsync_ReturnsBadRequest_WhenIdIsInvalid()
    {
        var users = new FakeUserDataAccess();
        var handler = new UserQueryHandler(users);

        UserExistsQueryResult result = await handler.ExistsAsync(0);

        Assert.False(result.Success);
        Assert.Equal(400, result.StatusCode);
        Assert.Equal("Not accepted ID 0", result.Message);
    }

    private static UserModel CreateUserModel(int userId)
    {
        return new UserModel(
            userid: userId,
            hashedpassword: "hashed-password",
            email: $"user{userId}@example.com",
            firstname: "First",
            lastname: "Last",
            phone: "0790000000",
            cityId: 1,
            areaId: 2,
            bio: "Bio",
            avatar: "avatar.png",
            joindate: DateTime.UtcNow,
            status: 1,
            roleid: 2,
            isdeleted: true
        );
    }

    private sealed class FakeUserDataAccess : IUserDataAccess
    {
        public UserModel? NextFindUser { get; set; } = CreateUserModel(1);
        public bool NextExists { get; set; } = true;
        public IReadOnlyList<UserModel> NextUsers { get; set; } = Array.Empty<UserModel>();

        public Task<IReadOnlyList<UserModel>> GetAllUsersAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
            => Task.FromResult(NextUsers);

        public Task<UserModel?> GetUserByIDAsync(int? userId, CancellationToken cancellationToken = default)
            => Task.FromResult(NextFindUser);

        public Task<UserModel?> GetUserByLoginAsync(string login, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<UserModel?> GetUserByLoginCandidatesAsync(IReadOnlyList<string> candidates, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<int> AddUserAsync(UserModel user, CancellationToken cancellationToken = default)
            => Task.FromResult(user.UserID ?? 1);

        public Task<bool> UpdateUserAsync(UserModel user, int actorUserId, CancellationToken cancellationToken = default)
            => Task.FromResult(true);

        public Task<bool> DeleteUserAsync(int? userId, int actorUserId, CancellationToken cancellationToken = default)
            => Task.FromResult(true);

        public Task<bool> DoesUserExistAsync(int? userId, CancellationToken cancellationToken = default)
            => Task.FromResult(NextExists);
    }
}
