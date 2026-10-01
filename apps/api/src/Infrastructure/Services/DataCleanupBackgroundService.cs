using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TijarahJo.Application.Abstractions.Services;

namespace TijarahJo.Infrastructure.Services;

/// <summary>
/// Background service that periodically runs data hygiene diagnostics and cleanup.
/// Delegates all detection and cleanup logic to <see cref="IDataHygieneService"/>.
/// 
/// Schedule:
///   - Runs every 6 hours
///   - Full diagnostic scan: only during off-peak (02:00-05:00 UTC)
///   - Lightweight purges: every cycle
/// </summary>
public sealed class DataCleanupBackgroundService(
    IServiceScopeFactory scopeFactory,
    ILogger<DataCleanupBackgroundService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(6);

    private readonly IServiceScopeFactory _scopeFactory = scopeFactory;
    private readonly ILogger<DataCleanupBackgroundService> _logger = logger;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation("DataCleanupBackgroundService started. Interval: {Interval}", Interval);
        }

        try
        {
            // Delay the first run by 2 minutes to let the app finish starting up
            await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await RunCycleAsync(stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "DataCleanupBackgroundService encountered an error during cleanup cycle");
                }

                await Task.Delay(Interval, stoppingToken);
            }
        }
        catch (OperationCanceledException)
        {
            // Ignored to allow graceful shutdown without noisy logs
        }

        _logger.LogInformation("DataCleanupBackgroundService stopped.");
    }

    private async Task RunCycleAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var hygieneService = scope.ServiceProvider.GetRequiredService<IDataHygieneService>();

        var report = await hygieneService.RunDiagnosticScanAsync(forceFullScan: false, ct);

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Cleanup cycle complete — Findings: {Findings}, Auto-executed: {Executed}, " +
                "Pending review: {Pending}, Rows affected: {Rows}",
                report.TotalFindings,
                report.AutoExecuted,
                report.PendingReview,
                report.TotalRowsAffected);
        }
    }
}
