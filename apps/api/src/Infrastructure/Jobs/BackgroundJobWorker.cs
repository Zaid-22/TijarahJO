using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace TijarahJo.Infrastructure.Jobs;

public sealed class BackgroundJobWorker : BackgroundService
{
    private readonly ChannelBackgroundJobService _jobService;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<BackgroundJobWorker> _logger;

    public BackgroundJobWorker(
        ChannelBackgroundJobService jobService,
        IServiceScopeFactory scopeFactory,
        ILogger<BackgroundJobWorker> logger)
    {
        _jobService = jobService;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Background job worker is starting.");

        try
        {
            await foreach (var workItem in _jobService.Reader.ReadAllAsync(stoppingToken))
            {
                try
                {
                    using IServiceScope scope = _scopeFactory.CreateScope();
                    await workItem(scope.ServiceProvider, stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error executing background job.");
                }
            }
        }
        catch (OperationCanceledException)
        {
            // Ignored to allow graceful shutdown without noisy logs
        }

        _logger.LogInformation("Background job worker is stopping.");
    }
}
