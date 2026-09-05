using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Application.Common;
using TijarahJo.Application.Services;
using TijarahJo.Domain.Models;

namespace TijarahJo.Api.Tests;

public sealed class SellerProfileServiceTests
{
    [Theory]
    [InlineData(UserStatusPolicy.Banned)]
    [InlineData(UserStatusPolicy.Inactive)]
    public async Task GetProfileAsync_ReturnsNotFound_ForNonActiveSeller(int status)
    {
        var users = new FakeUserDataAccess(CreateSeller(status));
        var listings = new FakePostListingQueryService();
        var service = new SellerProfileService(users, new FakeSellerReadService(), listings);

        SellerProfileResult result = await service.GetProfileAsync(42);

        Assert.False(result.Success);
        Assert.Equal(SellerProfileFailureReason.NotFound, result.FailureReason);
        Assert.Null(result.Profile);
        Assert.Equal(0, listings.QueryCalls);
    }

    private static UserModel CreateSeller(int status)
    {
        return new UserModel(
            userid: 42,
            hashedpassword: "hashed-password",
            email: "seller@example.com",
            firstname: "Test",
            lastname: "Seller",
            phone: "0790000000",
            cityId: 1,
            areaId: 2,
            bio: null,
            avatar: null,
            joindate: DateTime.UtcNow,
            status: status,
            roleid: 2,
            isdeleted: false);
    }

    private sealed class FakePostListingQueryService : IPostListingQueryService
    {
        public int QueryCalls { get; private set; }

        public Task<PostListingPageResult> QueryAsync(
            PostListingQuery query,
            CancellationToken cancellationToken = default)
        {
            QueryCalls++;
            return Task.FromResult(new PostListingPageResult());
        }
    }

    private sealed class FakeSellerReadService : ISellerReadService
    {
        public Task<IReadOnlyList<TopSellerReadModel>> GetTopSellersAsync(
            int takeCount = 10,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<TopSellerReadModel>>(Array.Empty<TopSellerReadModel>());
    }

    private sealed class FakeUserDataAccess(UserModel seller) : IUserDataAccess
    {
        public Task<UserModel?> GetUserByIDAsync(int? userId, CancellationToken cancellationToken = default)
            => Task.FromResult<UserModel?>(seller);

        public Task<int> AddUserAsync(UserModel user, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();

        public Task<bool> UpdateUserFieldsAsync(
            UserModel user,
            int actorUserId,
            UserUpdateFields fields,
            CancellationToken cancellationToken = default)
            => throw new NotSupportedException();

        public Task<bool> DeleteUserAsync(int? userId, int actorUserId, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();

        public Task<bool> DoesUserExistAsync(int? userId, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();

        public Task<IReadOnlyList<UserModel>> GetAllUsersAsync(
            int pageNumber = 1,
            int pageSize = 50,
            CancellationToken cancellationToken = default)
            => throw new NotSupportedException();

        public Task<UserModel?> GetUserByLoginAsync(string login, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();

        public Task<UserModel?> GetUserByLoginCandidatesAsync(
            IReadOnlyList<string> candidates,
            CancellationToken cancellationToken = default)
            => throw new NotSupportedException();
    }
}
