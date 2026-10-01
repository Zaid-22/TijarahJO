using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Infrastructure.Persistence;

namespace TijarahJo.Infrastructure.Services;

public sealed class SystemSettingsRuntimeService(
    TijarahJoDbContext dbContext,
    IMemoryCache cache) : ISystemSettingsRuntimeService
{
    private const string MaintenanceModeCacheKey = "system-settings:maintenance-mode";
    private static readonly TimeSpan MaintenanceModeCacheDuration = TimeSpan.FromSeconds(15);

    private readonly TijarahJoDbContext _dbContext = dbContext;
    private readonly IMemoryCache _cache = cache;

    public async Task<bool> IsMaintenanceModeEnabledAsync(CancellationToken cancellationToken = default)
    {
        if (_cache.TryGetValue(MaintenanceModeCacheKey, out PublicSystemStatus? cachedStatus) &&
            cachedStatus is not null)
        {
            return cachedStatus.MaintenanceMode;
        }

        PublicSystemStatus status = await GetPublicStatusCoreAsync(cancellationToken);
        _cache.Set(MaintenanceModeCacheKey, status, MaintenanceModeCacheDuration);
        return status.MaintenanceMode;
    }

    public async Task<PublicSystemStatus> GetPublicStatusAsync(CancellationToken cancellationToken = default)
    {
        if (_cache.TryGetValue(MaintenanceModeCacheKey, out PublicSystemStatus? cachedStatus) &&
            cachedStatus is not null)
        {
            return cachedStatus;
        }

        PublicSystemStatus status = await GetPublicStatusCoreAsync(cancellationToken);
        _cache.Set(MaintenanceModeCacheKey, status, MaintenanceModeCacheDuration);
        return status;
    }

    public async Task<bool> IsRegistrationEnabledAsync(CancellationToken cancellationToken = default)
    {
        // Delegate to GetPublicStatusAsync so there is a single cache entry and
        // no risk of the backend gate and the public status response going out of sync.
        PublicSystemStatus status = await GetPublicStatusAsync(cancellationToken);
        return status.RegistrationEnabled;
    }

    private async Task<PublicSystemStatus> GetPublicStatusCoreAsync(CancellationToken cancellationToken)
    {
        try
        {
            var settings = await _dbContext.SystemSettings
                .AsNoTracking()
                .Where(setting =>
                    setting.SettingKey == "MaintenanceMode" ||
                    setting.SettingKey == "MaintenanceReason" ||
                    setting.SettingKey == "MaintenanceExpectedReturn" ||
                    setting.SettingKey == "RegistrationEnabled")
                .Select(setting => new
                {
                    setting.SettingKey,
                    setting.Value,
                    setting.UpdatedAt
                })
                .ToListAsync(cancellationToken);

            var maintenanceSetting = settings.FirstOrDefault(setting => setting.SettingKey == "MaintenanceMode");
            var maintenanceReasonSetting = settings.FirstOrDefault(setting => setting.SettingKey == "MaintenanceReason");
            var maintenanceExpectedReturnSetting = settings.FirstOrDefault(setting => setting.SettingKey == "MaintenanceExpectedReturn");
            var registrationEnabledSetting = settings.FirstOrDefault(setting => setting.SettingKey == "RegistrationEnabled");

            if (maintenanceSetting is null)
            {
                return new PublicSystemStatus
                {
                    MaintenanceMode = false,
                    RegistrationEnabled = registrationEnabledSetting == null || ParseBooleanSetting(registrationEnabledSetting.Value)
                };
            }

            return new PublicSystemStatus
            {
                MaintenanceMode = ParseBooleanSetting(maintenanceSetting.Value),
                MaintenanceModeUpdatedAt = maintenanceSetting.UpdatedAt,
                MaintenanceReason = NormalizeTextSetting(maintenanceReasonSetting?.Value),
                MaintenanceExpectedReturn = NormalizeTextSetting(maintenanceExpectedReturnSetting?.Value),
                RegistrationEnabled = registrationEnabledSetting == null || ParseBooleanSetting(registrationEnabledSetting.Value)
            };
        }
        catch
        {
            return new PublicSystemStatus
            {
                MaintenanceMode = false,
                RegistrationEnabled = true // Fail open on DB errors
            };
        }
    }

    private static bool ParseBooleanSetting(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        string normalized = value.Trim().ToLowerInvariant();
        return normalized is "true" or "1" or "yes" or "on";
    }

    private static string? NormalizeTextSetting(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim();
    }
}
