import React, { useCallback, useMemo, useState } from "react";
import { Button } from "../../../shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../../../shared/ui/dialog";
import { isMobilePhone } from "../../../utils/device";
import type { PhoneLookupStatus } from "./postCardPhoneDialog";
import { resolvePhoneDialogCopy } from "./postCardPhoneDialog";
import { marketplaceTranslations } from "../translations";
import type { Language } from "../../../types";

interface PostCardPhoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone: string;
  status: PhoneLookupStatus;
  language: Language;
}

export function PostCardPhoneDialog({
  open,
  onOpenChange,
  phone,
  status,
  language,
}: PostCardPhoneDialogProps) {
  const [phoneCopied, setPhoneCopied] = useState(false);
  const isPhone = useMemo(() => isMobilePhone(), []);

  const t =
    marketplaceTranslations[
      language as keyof typeof marketplaceTranslations
    ] || marketplaceTranslations.en;

  const trimmedPhone = phone.trim();

  const effectiveStatus: PhoneLookupStatus = trimmedPhone ? "ready" : status;
  const phoneDialogCopy = resolvePhoneDialogCopy(
    language,
    trimmedPhone,
    effectiveStatus,
  );

  const handlePhoneNumberClick = useCallback(
    async (e: React.MouseEvent) => {
      if (isPhone) return; // let tel: link work
      e.preventDefault();
      try {
        await navigator.clipboard.writeText(trimmedPhone);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = trimmedPhone;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setPhoneCopied(true);
      setTimeout(() => setPhoneCopied(false), 2000);
    },
    [isPhone, trimmedPhone],
  );

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setPhoneCopied(false);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        hideCloseButton
        className="sm:max-w-[380px] border border-border/60 bg-background p-0 shadow-xl"
      >
        <DialogTitle className="sr-only">{phoneDialogCopy.title}</DialogTitle>
        <DialogDescription className="sr-only">
          {isPhone
            ? phoneDialogCopy.description
            : t.phoneClickToCopy}
        </DialogDescription>
        <div className="flex flex-col">
          <div className="border-b border-border/60 px-6 pb-5 pt-6 text-center">
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              {t.phoneNumber}
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {isPhone
                ? language === "ar"
                  ? "انقر على الرقم للاتصال بالبائع مباشرة"
                  : "Tap the number below to call the seller directly"
                : t.phoneClickToCopy}
            </p>
          </div>

          <div className="px-6 py-6">
            {phoneDialogCopy.canCall ? (
              <a
                href={isPhone ? `tel:${trimmedPhone}` : "#"}
                onClick={(e) => void handlePhoneNumberClick(e)}
                aria-label={
                  isPhone
                    ? `${phoneDialogCopy.callNowLabel} ${phoneDialogCopy.displayNumber}`
                    : language === "ar"
                      ? `نسخ الرقم ${phoneDialogCopy.displayNumber}`
                      : `Copy number ${phoneDialogCopy.displayNumber}`
                }
                className={`flex min-h-16 w-full items-center justify-center rounded-2xl border px-6 py-4 text-center transition-all duration-300 cursor-pointer ${
                  phoneCopied
                    ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400"
                    : "border-border bg-muted/30 text-foreground hover:bg-muted/50"
                }`}
                dir="ltr"
              >
                <div className="flex flex-col items-center font-sans">
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    {phoneCopied
                      ? t.copied
                      : t.sellerPhone}
                  </span>
                  <span className="mt-1 text-2xl font-bold tracking-tight">
                    {phoneDialogCopy.displayNumber}
                  </span>
                  {!isPhone && !phoneCopied && (
                    <span className="mt-1.5 text-xs text-muted-foreground/70">
                      {t.clickToCopy}
                    </span>
                  )}
                </div>
              </a>
            ) : (
              <div
                className="flex min-h-16 w-full items-center justify-center rounded-2xl border border-border bg-muted/30 px-6 py-4 text-center text-muted-foreground"
                dir="ltr"
              >
                <div className="flex flex-col items-center font-sans">
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    {t.sellerPhone}
                  </span>
                  <span className="mt-1 text-2xl font-bold tracking-tight">
                    {phoneDialogCopy.displayNumber}
                  </span>
                </div>
              </div>
            )}

            <Button
              variant="ghost"
              className="mt-3 w-full font-medium text-muted-foreground hover:text-foreground"
              onClick={() => handleClose(false)}
            >
              {t.goBack}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
