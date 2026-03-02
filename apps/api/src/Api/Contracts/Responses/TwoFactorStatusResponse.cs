namespace TijarahJoDBAPI.Contracts.Responses;

public sealed class TwoFactorStatusResponse
{
    public bool Enabled { get; set; }
    public bool HasPendingSetup { get; set; }
}
