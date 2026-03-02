import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "./dialog";
import { Button } from "./button";
import { Input } from "./input";

type TypeToConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmPhrase?: string;
  impactItems?: string[];
  onConfirm: () => void;
  variant?: "destructive" | "warning";
};

export function TypeToConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmPhrase = "DELETE",
  impactItems,
  onConfirm,
  variant = "destructive",
}: TypeToConfirmDialogProps) {
  const [typed, setTyped] = useState("");

  const handleConfirm = () => {
    if (typed === confirmPhrase) {
      onConfirm();
      setTyped("");
    }
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) setTyped("");
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle
            className={
              variant === "destructive" ? "text-destructive" : "text-amber-600"
            }
          >
            ⚠️ {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-3">
          {impactItems && impactItems.length > 0 && (
            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-sm font-medium text-foreground mb-2">
                This will affect:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {impactItems.map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-destructive" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <label
              htmlFor="type-confirm-input"
              className="text-sm font-medium text-foreground"
            >
              Type{" "}
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-destructive">
                {confirmPhrase}
              </span>{" "}
              to confirm:
            </label>
            <Input
              id="type-confirm-input"
              className="mt-2"
              placeholder={confirmPhrase}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={typed !== confirmPhrase}
            onClick={handleConfirm}
          >
            {title}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
