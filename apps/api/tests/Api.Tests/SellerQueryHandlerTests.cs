using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDB.Application.Services;

namespace TijarahJo.Api.Tests;

public sealed class SellerQueryHandlerTests
{
    [Fact]
    public async Task GetProfileAsync_ReturnsInvalidRequest_WhenSellerIdIsNotNumeric()
    {
        var profiles = new FakeSellerProfileService();
        var handler = new SellerQueryHandler(profiles);

        SellerProfileResult result = await handler.GetProfileAsync(new SellerProfileQuery { SellerId = "abc" });

        Assert.False(result.Success);
        Assert.Equal(SellerProfileFailureReason.InvalidRequest, result.FailureReason);
        Assert.Equal("Invalid seller ID: abc", result.Message);
        Assert.Equal(0, profiles.GetProfileCalls);
    }

    [Fact]
    public async Task GetProfileAsync_DelegatesToSellerProfileService_WhenSellerIdIsValid()
    {
        var expected = new SellerProfileResult
        {
            Success = true,
            Profile = new SellerProfileReadModel
            {
                Seller = new SellerSummaryReadModel
                {
                    Id = "42",
                    Name = "Seller",
                    Phone = string.Empty,
                    City = string.Empty,
                    Area = string.Empty,
                    Bio = string.Empty,
                    Avatar = string.Empty,
                    JoinedDate = DateTime.UtcNow.ToString("o"),
                    ActiveListingsCount = 0,
                    TotalSalesCount = 0
                },
                Posts = Array.Empty<SellerPostReadModel>()
            }
        };
        var profiles = new FakeSellerProfileService { NextProfileResult = expected };
        var handler = new SellerQueryHandler(profiles);

        SellerProfileResult result = await handler.GetProfileAsync(new SellerProfileQuery { SellerId = "42" });

        Assert.True(result.Success);
        Assert.Same(expected.Profile, result.Profile);
        Assert.Equal(42, profiles.LastSellerId);
        Assert.Equal(1, profiles.GetProfileCalls);
    }

    private sealed class FakeSellerProfileService : ISellerProfileService
    {
        public SellerProfileResult NextProfileResult { get; set; } = new();
        public TopSellersResult NextTopSellersResult { get; set; } = new();
        public int GetProfileCalls { get; private set; }
        public int? LastSellerId { get; private set; }

        public Task<SellerProfileResult> GetProfileAsync(int sellerId, CancellationToken cancellationToken = default)
        {
            GetProfileCalls++;
            LastSellerId = sellerId;
            return Task.FromResult(NextProfileResult);
        }

        public Task<TopSellersResult> GetTopSellersAsync(int takeCount = 10, CancellationToken cancellationToken = default)
            => Task.FromResult(NextTopSellersResult);
    }
}
