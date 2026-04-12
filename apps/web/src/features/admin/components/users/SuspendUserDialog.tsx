import { ShieldBan } from "lucide-react";
import { Button } from "../../../../shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../../shared/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../shared/ui/select";

interface SuspendUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string | undefined;
  durationHours: string;
  onDurationChange: (value: string) => void;
  onSuspend: () => void;
  isSuspending: boolean;
}

export function SuspendUserDialog({
  open,
  onOpenChange,
  userName,
  durationHours,
  onDurationChange,
  onSuspend,
  isSuspending,
}: SuspendUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Suspend User</DialogTitle>
        </DialogHeader>
        {userName && (
          <div className="space-y-4 py-3">
            <p className="text-sm text-muted-foreground">
              You are about to suspend <strong>{userName}</strong>. This will
              immediately invalidate their active sessions and prevent them from
              logging in.
            </p>
            <div className="space-y-2">
              <div id="suspension-duration-label" className="text-sm font-medium">
                Suspension Duration
              </div>
              <Select value={durationHours} onValueChange={onDurationChange}>
                <SelectTrigger aria-labelledby="suspension-duration-label">
                  <SelectValue placeholder="Duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Hour</SelectItem>
                  <SelectItem value="24">24 Hours</SelectItem>
                  <SelectItem value="168">7 Days</SelectItem>
                  <SelectItem value="720">30 Days</SelectItem>
                  <SelectItem value="null">Permanent Ban</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onSuspend}
            disabled={isSuspending}
            aria-label="Apply Suspension"
          >
            {isSuspending ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                <ShieldBan className="w-3.5 h-3.5 mr-1.5" />
                Apply Suspension
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
