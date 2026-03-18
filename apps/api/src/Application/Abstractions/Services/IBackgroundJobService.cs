using System;
using System.Threading;
using System.Threading.Tasks;

namespace TijarahJo.Application.Abstractions.Services;

/// <summary>
/// Abstraction for enqueueing background work items that run outside
/// the HTTP request lifetime (e.g. sending emails, cache warming).
/// </summary>
public interface IBackgroundJobService
{
    ValueTask EnqueueAsync(Func<IServiceProvider, CancellationToken, Task> workItem, CancellationToken cancellationToken = default);
}
