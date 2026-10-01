import { useState } from "react";
import { Ban, ShieldBan, UserCheck } from "lucide-react";
import { Button } from "../../../../shared/ui/button";
import { SuspendUserDialog } from "./SuspendUserDialog";

interface BulkUserActionsBarProps {
  selectedCount: number;
  isSuspending: boolean;
  onBan: () => void;
  onActivate: () => void;
  onClear: () => void;
  onSuspend: (durationHours: number | null) => void;
}

export function BulkUserActionsBar({
  selectedCount,
  isSuspending,
  onBan,
  onActivate,
  onClear,
  onSuspend,
}: BulkUserActionsBarProps) {
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [durationHours, setDurationHours] = useState("24");

  const handleOpenSuspend = () => {
    setDurationHours("24");
    setIsSuspendOpen(true);
  };

  const handleSuspend = () => {
    onSuspend(durationHours === "null" ? null : Number(durationHours));
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-3 rounded-lg border border-border bg-card px-5 py-3 shadow-xl">
        <span className="text-sm font-medium text-foreground">
          {selectedCount} selected
        </span>
        <div className="h-4 w-px bg-border" />
        <Button variant="destructive" size="sm" onClick={handleOpenSuspend}>
          <ShieldBan className="w-3.5 h-3.5 mr-1.5" />
          Bulk Suspend
        </Button>
        <Button variant="destructive" size="sm" onClick={onBan}>
          <Ban className="w-3.5 h-3.5 mr-1.5" />
          Bulk Ban
        </Button>
        <Button variant="outline" size="sm" onClick={onActivate}>
          <UserCheck className="w-3.5 h-3.5 mr-1.5" />
          Bulk Activate
        </Button>
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear
        </Button>
      </div>

      <SuspendUserDialog
        open={isSuspendOpen}
        onOpenChange={setIsSuspendOpen}
        userName={`${selectedCount} selected users`}
        title="Suspend Selected Users"
        description={`Apply a suspension to ${selectedCount} selected users. This will immediately invalidate their active sessions and prevent them from logging in.`}
        durationHours={durationHours}
        onDurationChange={setDurationHours}
        onSuspend={handleSuspend}
        isSuspending={isSuspending}
      />
    </>
  );
}
