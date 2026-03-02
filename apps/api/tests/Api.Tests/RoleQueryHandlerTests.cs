using Models;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.Application.Services;
using TijarahJoDB.BLL;

namespace TijarahJoDBAPI.Tests;

public sealed class RoleQueryHandlerTests
{
    [Fact]
    public async Task GetByIdAsync_ReturnsBadRequest_WhenIdInvalid()
    {
        var service = new FakeRoleService();
        var handler = new RoleQueryHandler(service);

        RoleByIdQueryResult result = await handler.GetByIdAsync(0);

        Assert.False(result.Success);
        Assert.Equal(400, result.StatusCode);
        Assert.Equal("Not accepted ID 0", result.Message);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNotFound_WhenRoleMissing()
    {
        var service = new FakeRoleService
        {
            NextFindResult = null
        };
        var handler = new RoleQueryHandler(service);

        RoleByIdQueryResult result = await handler.GetByIdAsync(8);

        Assert.False(result.Success);
        Assert.Equal(404, result.StatusCode);
        Assert.Equal("Role with ID 8 not found.", result.Message);
    }

    [Fact]
    public async Task GetAllAsync_FiltersDeletedRoles()
    {
        DateTime now = DateTime.UtcNow;
        var service = new FakeRoleService
        {
            Roles = new List<RoleModel>
            {
                CreateRole(1, "USER", now, isDeleted: false),
                CreateRole(2, "ADMIN", now, isDeleted: true)
            }
        };
        var handler = new RoleQueryHandler(service);

        RoleListQueryResult result = await handler.GetAllAsync();

        Assert.True(result.Success);
        Assert.Single(result.Roles);
        Assert.Equal("USER", result.Roles[0].RoleName);
    }

    [Fact]
    public async Task ExistsAsync_ReturnsBadRequest_WhenIdInvalid()
    {
        var service = new FakeRoleService();
        var handler = new RoleQueryHandler(service);

        RoleExistsQueryResult result = await handler.ExistsAsync(0);

        Assert.False(result.Success);
        Assert.Equal(400, result.StatusCode);
        Assert.Equal("Not accepted ID 0", result.Message);
    }

    private static RoleModel CreateRole(int id, string roleName, DateTime createdAt, bool isDeleted)
    {
        return new RoleModel(
            roleid: id,
            rolename: roleName,
            createdat: createdAt,
            isdeleted: isDeleted
        );
    }

    private sealed class FakeRoleService : IRoleService
    {
        public IReadOnlyList<RoleModel> Roles { get; set; } = Array.Empty<RoleModel>();
        public Role? NextFindResult { get; set; } = new Role(CreateRole(1, "USER", DateTime.UtcNow, isDeleted: false), Role.ModeType.Update);
        public bool NextExists { get; set; } = true;

        public IReadOnlyList<RoleModel> GetAllRoles() => Roles;

        public Task<IReadOnlyList<RoleModel>> GetAllRolesAsync(CancellationToken cancellationToken = default)
            => Task.FromResult(Roles);

        public Role? Find(int? roleId) => NextFindResult;

        public Task<Role?> FindAsync(int? roleId, CancellationToken cancellationToken = default)
            => Task.FromResult(NextFindResult);

        public Role Create(RoleModel model) => new(model);

        public Task<bool> SaveAsync(Role role, CancellationToken cancellationToken = default)
            => Task.FromResult(true);

        public Task<bool> DeleteRoleAsync(int? roleId, CancellationToken cancellationToken = default)
            => Task.FromResult(true);

        public bool DoesRoleExist(int? roleId) => NextExists;

        public Task<bool> DoesRoleExistAsync(int? roleId, CancellationToken cancellationToken = default)
            => Task.FromResult(NextExists);
    }
}
