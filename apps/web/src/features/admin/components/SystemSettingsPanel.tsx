import { useEffect, useState } from "react";
import { Settings, Save, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../shared/ui/button";
import { Badge } from "../../../shared/ui/badge";
import { Switch } from "../../../shared/ui/switch";
import { api } from "../../../services/api";
import { SystemSettingItem } from "../../../services/api/admin";
import { formatCompactDateTime } from "../../../shared/lib/dateTime";
import { logger } from "../../../shared/lib/logger";

export function SystemSettingsPanel() {
  const [settings, setSettings] = useState<SystemSettingItem[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const result = await api.admin.getSettings();
      setSettings(result);
      const initial: Record<string, string> = {};
      result.forEach((s) => {
        initial[s.settingKey] = s.value;
      });
      setEditedValues(initial);
    } catch (error) {
      logger.warn("[SystemSettingsPanel] Failed to fetch settings", error);
      toast.error("Failed to fetch settings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchSettings();
  }, []);

  const handleSave = async (key: string) => {
    const newValue = editedValues[key];
    if (newValue === undefined) return;

    try {
      setSavingKey(key);
      const success = await api.admin.updateSetting(key, newValue);
      if (success) {
        toast.success(`Setting "${key}" updated`);
        await fetchSettings();
      } else {
        toast.error("Failed to update setting");
      }
    } catch (error) {
      logger.warn("[SystemSettingsPanel] Failed to update setting", error);
      toast.error("Error updating setting");
    } finally {
      setSavingKey(null);
    }
  };

  const handleValueChange = (key: string, value: string) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  };

  const isModified = (setting: SystemSettingItem) =>
    editedValues[setting.settingKey] !== setting.value;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (settings.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            System Settings
          </h1>
        </div>
        <div className="rounded-md border border-border p-8 text-center text-muted-foreground">
          <p className="text-lg mb-2">No settings configured yet.</p>
          <p className="text-sm">
            Settings can be seeded into the <code>SystemSettings</code> database
            table.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
      </div>

      <div className="grid gap-4">
        {settings.map((setting) => (
          <div
            key={setting.settingKey}
            className="rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">
                    {setting.label}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {setting.valueType}
                  </Badge>
                </div>
                {setting.description && (
                  <p className="text-sm text-muted-foreground flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    {setting.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Key: <code className="text-xs">{setting.settingKey}</code> ·
                  Last updated: {formatCompactDateTime(setting.updatedAt)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {setting.valueType === "bool" ? (
                  <Switch
                    checked={editedValues[setting.settingKey] === "true"}
                    aria-label={`Toggle ${setting.label}`}
                    onCheckedChange={(checked) =>
                      handleValueChange(
                        setting.settingKey,
                        checked ? "true" : "false"
                      )
                    }
                  />
                ) : (
                  <input
                    type={setting.valueType === "int" ? "number" : "text"}
                    className="flex h-10 w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={editedValues[setting.settingKey] ?? ""}
                    aria-label={`Value for ${setting.label}`}
                    onChange={(e) =>
                      handleValueChange(setting.settingKey, e.target.value)
                    }
                  />
                )}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    !isModified(setting) || savingKey === setting.settingKey
                  }
                  onClick={() => handleSave(setting.settingKey)}
                >
                  <Save className="w-4 h-4 mr-1" />
                  {savingKey === setting.settingKey ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
