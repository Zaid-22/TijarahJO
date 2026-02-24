using System.Threading;
using System.Threading.Tasks;

namespace TijarahJoDB.Application.Abstractions.DataAccess;

public enum ExternalIdentityLinkStatus
{
    Linked,
    AlreadyLinkedToSameUser,
    LinkedToAnotherUser,
    InvalidRequest,
    Failed
}

public sealed class ExternalIdentityLinkResult
{
    public ExternalIdentityLinkStatus Status { get; init; }
    public int? LinkedUserId { get; init; }
}

public interface IExternalIdentityDataAccess
{
    Task<int?> FindUserIdByProviderSubjectAsync(
        string provider,
        string providerSubject,
        CancellationToken cancellationToken = default
    );

    Task<ExternalIdentityLinkResult> LinkIdentityToUserAsync(
        int userId,
        string provider,
        string providerSubject,
        string? providerEmail,
        CancellationToken cancellationToken = default
    );
}
