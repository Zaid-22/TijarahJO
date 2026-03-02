using System.Threading;
using System.Threading.Tasks;

namespace TijarahJoDBAPI.Common.Services;

public interface ITokenBlacklistService
{
    Task AddToBlacklistAsync(string jti, DateTimeOffset expiration, CancellationToken cancellationToken = default);
    Task<bool> IsBlacklistedAsync(string jti, CancellationToken cancellationToken = default);
}
