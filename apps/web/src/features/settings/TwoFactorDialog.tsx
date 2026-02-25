import { Button } from "../../shared/ui/button";
import { Input } from "../../shared/ui/input";
import { Label } from "../../shared/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../shared/ui/dialog";
import type { Language } from "../../translations";
import type { TwoFactorCopy, TwoFactorDialogMode } from "./useTwoFactorSettings";

interface TwoFactorDialogProps {
  language: Language;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: TwoFactorDialogMode;
  copy: TwoFactorCopy;
  secretKey: string;
  otpAuthUri: string;
  code: string;
  error: string;
  isPending: boolean;
  onCopyText: (value: string) => Promise<void>;
  onCodeChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export function TwoFactorDialog({
  language,
  open,
  onOpenChange,
  mode,
  copy,
  secretKey,
  otpAuthUri,
  code,
  error,
  isPending,
  onCopyText,
  onCodeChange,
  onCancel,
  onConfirm,
}: TwoFactorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "setup" ? copy.setupTitle : copy.disableTitle}
          </DialogTitle>
          <DialogDescription>
            {mode === "setup" ? copy.setupDescription : copy.disableDescription}
          </DialogDescription>
        </DialogHeader>

        {mode === "setup" && (
          <div className="space-y-3">
            <div>
              <Label>{copy.secretKeyLabel}</Label>
              <div className="mt-1 rounded-md border bg-muted/30 px-3 py-2 font-mono text-sm break-all">
                {secretKey}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-1 h-8 px-2"
                onClick={() => void onCopyText(secretKey)}
              >
                {language === "ar" ? "نسخ المفتاح" : "Copy key"}
              </Button>
            </div>
            <div>
              <Label>{copy.otpUriLabel}</Label>
              <div className="mt-1 rounded-md border bg-muted/30 px-3 py-2 text-xs break-all">
                {otpAuthUri}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-1 h-8 px-2"
                onClick={() => void onCopyText(otpAuthUri)}
              >
                {language === "ar" ? "نسخ الرابط" : "Copy URI"}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="twoFactorCode">{copy.codeLabel}</Label>
          <Input
            id="twoFactorCode"
            value={code}
            onChange={(event) => onCodeChange(event.target.value)}
            maxLength={6}
            placeholder={copy.codePlaceholder}
            inputMode="numeric"
            autoComplete="one-time-code"
          />
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            {copy.cancel}
          </Button>
          <Button
            onClick={() => void onConfirm()}
            disabled={isPending}
          >
            {isPending
              ? language === "ar"
                ? "جارٍ التنفيذ..."
                : "Processing..."
              : mode === "setup"
                ? copy.confirmSetup
                : copy.confirmDisable}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
