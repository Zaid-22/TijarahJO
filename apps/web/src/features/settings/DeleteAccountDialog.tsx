import { Button } from "../../shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../shared/ui/dialog";
import type { Language } from "../../translations";

interface DeleteAccountDialogProps {
  language: Language;
  open: boolean;
  pending: boolean;
  cancelLabel: string;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteAccountDialog({
  language,
  open,
  pending,
  cancelLabel,
  onOpenChange,
  onCancel,
  onConfirm,
}: DeleteAccountDialogProps) {
  const isRTL = language === "ar";
  const dialogTitle = isRTL
    ? "تأكيد حذف الحساب"
    : "Confirm account deletion";
  const dialogDescription = isRTL
    ? "سيتم حذف حسابك نهائيًا مع جميع بياناته. لا يمكن التراجع عن هذا الإجراء."
    : "Your account and all associated data will be permanently deleted. This action cannot be undone.";
  const confirmLabel = isRTL
    ? "حذف الحساب نهائيًا"
    : "Delete account permanently";
  const processingLabel = isRTL
    ? "جارٍ الحذف..."
    : "Deleting...";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={pending}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="destructive"
            onClick={() => void onConfirm()}
            disabled={pending}
          >
            {pending ? processingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
