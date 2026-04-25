using TijarahJo.Api.Common.Services;

namespace TijarahJo.Api.Tests;

/// <summary>
/// Tests for InMemoryChatPresenceService — validates connection tracking,
/// online status detection, and grace period behavior.
/// </summary>
public sealed class InMemoryChatPresenceServiceTests
{
    [Fact]
    public async Task MarkConnected_Then_IsUserOnline_ReturnsTrue()
    {
        var service = new InMemoryChatPresenceService();

        await service.MarkConnectedAsync(1, "conn-001");

        Assert.True(await service.IsUserOnlineAsync(1));
    }

    [Fact]
    public async Task IsUserOnline_WithNoConnections_ReturnsFalse()
    {
        var service = new InMemoryChatPresenceService();

        Assert.False(await service.IsUserOnlineAsync(999));
    }

    [Fact]
    public async Task MarkDisconnected_RemovesConnection()
    {
        var service = new InMemoryChatPresenceService();

        await service.MarkConnectedAsync(1, "conn-001");
        await service.MarkDisconnectedAsync(1, "conn-001");

        // Grace period keeps them "online" briefly, so check connections are empty
        var connections = await service.GetUserConnectionIdsAsync(1);
        Assert.Empty(connections);
    }

    [Fact]
    public async Task MultipleConnections_StillOnline_AfterOneDisconnects()
    {
        var service = new InMemoryChatPresenceService();

        await service.MarkConnectedAsync(1, "conn-001");
        await service.MarkConnectedAsync(1, "conn-002");
        await service.MarkDisconnectedAsync(1, "conn-001");

        Assert.True(await service.IsUserOnlineAsync(1));
        var connections = await service.GetUserConnectionIdsAsync(1);
        Assert.Single(connections);
        Assert.Contains("conn-002", connections);
    }

    [Fact]
    public async Task GetUserConnectionIds_ReturnsAllConnections()
    {
        var service = new InMemoryChatPresenceService();

        await service.MarkConnectedAsync(1, "conn-a");
        await service.MarkConnectedAsync(1, "conn-b");
        await service.MarkConnectedAsync(1, "conn-c");

        var connections = await service.GetUserConnectionIdsAsync(1);
        Assert.Equal(3, connections.Count);
    }

    [Fact]
    public async Task GetUserConnectionIds_InvalidUser_ReturnsEmpty()
    {
        var service = new InMemoryChatPresenceService();

        var connections = await service.GetUserConnectionIdsAsync(0);
        Assert.Empty(connections);

        connections = await service.GetUserConnectionIdsAsync(-1);
        Assert.Empty(connections);
    }

    [Fact]
    public async Task MarkConnected_WithInvalidArgs_IsNoOp()
    {
        var service = new InMemoryChatPresenceService();

        // Invalid userId
        await service.MarkConnectedAsync(0, "conn-001");
        Assert.False(await service.IsUserOnlineAsync(0));

        // Empty connectionId
        await service.MarkConnectedAsync(1, "");
        var connections = await service.GetUserConnectionIdsAsync(1);
        Assert.Empty(connections);
    }

    [Fact]
    public async Task GetLastSeenUtc_ReturnsNull_ForUnknownUser()
    {
        var service = new InMemoryChatPresenceService();

        var lastSeen = await service.GetLastSeenUtcAsync(999);
        Assert.Null(lastSeen);
    }

    [Fact]
    public async Task GetLastSeenUtc_ReturnsTimestamp_AfterConnection()
    {
        var service = new InMemoryChatPresenceService();
        var before = DateTime.UtcNow;

        await service.MarkConnectedAsync(1, "conn-001");

        var lastSeen = await service.GetLastSeenUtcAsync(1);
        Assert.NotNull(lastSeen);
        Assert.True(lastSeen.Value >= before);
    }

    [Fact]
    public async Task GetLastSeenUtc_InvalidUserId_ReturnsNull()
    {
        var service = new InMemoryChatPresenceService();

        Assert.Null(await service.GetLastSeenUtcAsync(0));
        Assert.Null(await service.GetLastSeenUtcAsync(-5));
    }

    [Fact]
    public async Task IsUserOnline_InvalidUserId_ReturnsFalse()
    {
        var service = new InMemoryChatPresenceService();

        Assert.False(await service.IsUserOnlineAsync(0));
        Assert.False(await service.IsUserOnlineAsync(-1));
    }
}
