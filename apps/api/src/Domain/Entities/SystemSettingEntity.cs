using System;

namespace TijarahJoDB.DAL.Entities;

/// <summary>
/// Represents a global system configuration key-value pair.
/// Used by admins to toggle feature flags such as maintenance mode, force 2FA, etc.
/// </summary>
public sealed class SystemSettingEntity
{
    [System.ComponentModel.DataAnnotations.Key]
    public int SettingID { get; set; }

    /// <summary>Unique machine-readable key (e.g. "MaintenanceMode", "Force2FA").</summary>
    public string SettingKey { get; set; } = string.Empty;

    /// <summary>Human-readable label for the admin panel.</summary>
    public string Label { get; set; } = string.Empty;

    /// <summary>Current value of the setting (serialised as string).</summary>
    public string Value { get; set; } = string.Empty;

    /// <summary>Data type hint: "bool", "string", "int".</summary>
    public string ValueType { get; set; } = "bool";

    /// <summary>Optional description shown in the admin UI.</summary>
    public string? Description { get; set; }

    public DateTime UpdatedAt { get; set; }
}
