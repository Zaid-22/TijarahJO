using System;
using System.Threading;
using System.Threading.Channels;
using System.Threading.Tasks;
using TijarahJoDB.Application.Abstractions.Services;

namespace TijarahJoDB.Infrastructure.Jobs;

public sealed class ChannelBackgroundJobService : IBackgroundJobService
{
    private readonly Channel<Func<IServiceProvider, CancellationToken, Task>> _channel;

    public ChannelBackgroundJobService()
    {
        _channel = Channel.CreateBounded<Func<IServiceProvider, CancellationToken, Task>>(
            new BoundedChannelOptions(100)
            {
                FullMode = BoundedChannelFullMode.Wait
            });
    }

    public async ValueTask EnqueueAsync(Func<IServiceProvider, CancellationToken, Task> workItem, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(workItem);
        await _channel.Writer.WriteAsync(workItem, cancellationToken);
    }

    internal ChannelReader<Func<IServiceProvider, CancellationToken, Task>> Reader => _channel.Reader;
}
