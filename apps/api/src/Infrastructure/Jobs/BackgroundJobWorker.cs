using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace TijarahJo.Infrastructure.Jobs;

public sealed class BackgroundJobWorker(
    ChannelBackgroundJobService jobService,
    IServiceScopeFactory scopeFactory,
    ILogger<BackgroundJobWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Background job worker is starting.");

        try
        {
            await foreach (var workItem in jobService.Reader.ReadAllAsync(stoppingToken))
            {
                try
                {
                    using IServiceScope scope = scopeFactory.CreateScope();
                    await workItem(scope.ServiceProvider, stoppingToken);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error executing background job.");
                }
            }
        }
        catch (OperationCanceledException)
        {
            // Ignored to allow graceful shutdown without noisy logs
        }

        logger.LogInformation("Background job worker is stopping.");
    }
}
