using System;
using System.Threading;
using System.Threading.Tasks;

namespace TijarahJo.Application.Abstractions.Services;

public sealed class PublicSystemStatus
{
    public bool MaintenanceMode { get; init; }
    public DateTime? MaintenanceModeUpdatedAt { get; init; }
}

public interface ISystemSettingsRuntimeService
{
    Task<bool> IsMaintenanceModeEnabledAsync(CancellationToken cancellationToken = default);
    Task<PublicSystemStatus> GetPublicStatusAsync(CancellationToken cancellationToken = default);
}
