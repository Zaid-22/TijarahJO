using System;
using System.Threading;
using System.Threading.Tasks;

namespace TijarahJo.Application.Abstractions.Services;

public sealed class PublicSystemStatus
{
    public bool MaintenanceMode { get; init; }
    public DateTime? MaintenanceModeUpdatedAt { get; init; }
    public string? MaintenanceReason { get; init; }
    public string? MaintenanceExpectedReturn { get; init; }
    public bool RegistrationEnabled { get; init; } = true;
}

public interface ISystemSettingsRuntimeService
{
    Task<bool> IsMaintenanceModeEnabledAsync(CancellationToken cancellationToken = default);
    Task<PublicSystemStatus> GetPublicStatusAsync(CancellationToken cancellationToken = default);
    Task<bool> IsRegistrationEnabledAsync(CancellationToken cancellationToken = default);
}
