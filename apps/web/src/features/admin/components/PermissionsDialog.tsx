import { useMemo, useState } from "react";
import { Shield } from "lucide-react";
import { Button } from "../../../shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../shared/ui/dialog";
import { toast } from "sonner";
import { api } from "../../../services/api";
import { logger } from "../../../shared/lib/logger";
import type { PermissionItem } from "../../../services/api/admin";

type Props = {
  roleName: string;
  roleId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PermissionsDialog({
  roleName,
  roleId,
  open,
  onOpenChange,
}: Props) {
  const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([]);
  const [selectedPermIds, setSelectedPermIds] = useState<Set<number>>(
    new Set(),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load data when dialog opens
  const handleOpen = async () => {
    if (loaded) return;
    try {
      const [perms, rolePerms] = await Promise.all([
        api.admin.getPermissions(),
        api.admin.getRolePermissions(roleId),
      ]);
      setAllPermissions(perms);
      setSelectedPermIds(new Set(rolePerms));
      setLoaded(true);
    } catch (error) {
      logger.warn("[PermissionsDialog] Failed to load", error);
      toast.error("Failed to load permissions");
    }
  };

  // Reset on close, load on open
  const handleOpenChange = (val: boolean) => {
    if (val) {
      void handleOpen();
    } else {
      setLoaded(false);
    }
    onOpenChange(val);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.admin.updateRolePermissions(
        roleId,
        Array.from(selectedPermIds),
      );
      toast.success(`Permissions updated for ${roleName}`);
      onOpenChange(false);
      setLoaded(false);
    } catch (error) {
      logger.warn("[PermissionsDialog] Failed to save", error);
      toast.error("Failed to save permissions");
    } finally {
      setIsSaving(false);
    }
  };

  const togglePermission = (permId: number) => {
    setSelectedPermIds((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) {
        next.delete(permId);
      } else {
        next.add(permId);
      }
      return next;
    });
  };

  const permissionsByCategory = useMemo(() => {
    const groups: Record<string, PermissionItem[]> = {};
    for (const p of allPermissions) {
      const cat = p.category || "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    }
    return groups;
  }, [allPermissions]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <Shield className="inline w-5 h-5 mr-2 text-primary" />
            Permissions — {roleName}
          </DialogTitle>
          <DialogDescription>
            Toggle the permissions this role should have.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {Object.entries(permissionsByCategory).map(([category, perms]) => (
            <div key={category}>
              <h4 className="text-xs uppercase font-semibold text-muted-foreground mb-2">
                {category}
              </h4>
              <div className="space-y-1">
                {perms.map((perm) => {
                  const checked = selectedPermIds.has(perm.permissionID);
                  return (
                    <label
                      key={perm.permissionID}
                      htmlFor={`perm-${perm.permissionID}`}
                      className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <input
                        id={`perm-${perm.permissionID}`}
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePermission(perm.permissionID)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {perm.permissionKey}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {perm.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
          {!loaded && (
            <div className="flex justify-center py-8">
              <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
          {loaded && allPermissions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No permissions defined yet. Add them in the database.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Permissions"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
