import { useState, useCallback, useMemo } from "react";
import { EditPostDialog } from "../../features/marketplace/components/EditPostDialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../shared/ui/alert-dialog";
import { Button } from "../../shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../../shared/ui/dialog";
import { Label } from "../../shared/ui/label";
import type { Language, Post } from "../../types";
import type {
  UpdatePostInput,
  UpdatePostStatusInput,
} from "../../app/routes/usePostActions";

type RemoveReason = "sold" | "no_longer_available" | "mistake" | "other";

/** Detect if the current device is a phone (capable of making calls). */
function isMobilePhone(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /Android.*Mobile|iPhone|iPod|Windows Phone|BlackBerry|Opera Mini|IEMobile/i.test(
    ua,
  );
}

interface PostActionDialogsProps {
  language: Language;
  isRTL: boolean;
  post: Post;
  sellerPhone: string | null;
  showEditDialog: boolean;
  setShowEditDialog: (open: boolean) => void;
  showDeleteDialog: boolean;
  setShowDeleteDialog: (open: boolean) => void;
  showPhoneDialog: boolean;
  setShowPhoneDialog: (open: boolean) => void;
  onUpdatePost?: (post: UpdatePostInput) => void | Promise<void>;
  onUpdatePostStatus?: (
    statusData: UpdatePostStatusInput,
  ) => void | Promise<void>;
  onDeletePost?: (postId: string) => void | Promise<void>;
}

export function PostActionDialogs({
  language,

  post,
  sellerPhone,
  showEditDialog,
  setShowEditDialog,
  showDeleteDialog,
  setShowDeleteDialog,
  showPhoneDialog,
  setShowPhoneDialog,
  onUpdatePost,
  onUpdatePostStatus,
  onDeletePost,
}: PostActionDialogsProps) {
  const [selectedReason, setSelectedReason] = useState<RemoveReason | null>(
    null,
  );
  const [otherText, setOtherText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const isPhone = useMemo(() => isMobilePhone(), []);
  const phoneNumber = (sellerPhone || post.phone || "").trim();
  const hasPhoneNumber = phoneNumber.length > 0;
  const unavailablePhoneLabel = language === "ar" ? "غير متوفر" : "Unavailable";
  const unavailablePhoneMessage =
    language === "ar"
      ? "رقم الهاتف غير متوفر لهذا البائع"
      : "Phone number is not available for this seller";

  const handlePhoneClick = useCallback(
    async (e: React.MouseEvent) => {
      if (!hasPhoneNumber) {
        e.preventDefault();
        return;
      }

      if (isPhone) {
        // On phones, let the tel: link work naturally
        return;
      }
      // On non-phone devices, prevent call and copy to clipboard instead
      e.preventDefault();
      try {
        await navigator.clipboard.writeText(phoneNumber);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = phoneNumber;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    },
    [hasPhoneNumber, isPhone, phoneNumber],
  );

  const reasons: { value: RemoveReason; label: string }[] = [
    {
      value: "sold",
      label: language === "ar" ? "تم بيعه" : "It was sold",
    },
    {
      value: "no_longer_available",
      label: language === "ar" ? "لم يعد متاحاً" : "No longer available",
    },
    {
      value: "mistake",
      label: language === "ar" ? "تم إدراجه بالخطأ" : "Listed by mistake",
    },
    {
      value: "other",
      label: language === "ar" ? "أخرى" : "Other",
    },
  ];

  const handleRemoveConfirm = async () => {
    if (!selectedReason) return;
    setIsSubmitting(true);
    try {
      if (selectedReason === "sold") {
        if (onUpdatePostStatus) {
          await onUpdatePostStatus({ id: post.id, status: "SOLD" });
        }
      } else {
        if (onDeletePost) {
          await onDeletePost(post.id);
        }
      }
      setShowDeleteDialog(false);
      setSelectedReason(null);
      setOtherText("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDialogClose = (open: boolean) => {
    if (!open) {
      setSelectedReason(null);
      setOtherText("");
    }
    setShowDeleteDialog(open);
  };

  // Reset "copied" state when dialog closes
  const handlePhoneDialogChange = (open: boolean) => {
    if (!open) setCopied(false);
    setShowPhoneDialog(open);
  };

  return (
    <>
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <EditPostDialog
          post={post}
            onSave={async (updatedPost) => {
              if (onUpdatePost) {
                await onUpdatePost(updatedPost as UpdatePostInput);
              }
              setShowEditDialog(false);
            }}
          onCancel={() => setShowEditDialog(false)}
          language={language}
        />
      </Dialog>

      {/* Remove Post with Reason Dialog */}
      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={handleDeleteDialogClose}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">
              {language === "ar"
                ? "لماذا تريد إزالة هذا المنشور؟"
                : "Why are you removing this post?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "ar"
                ? "اختر السبب لمساعدتنا في تحسين تجربة الاستخدام."
                : "Select a reason to help us improve your experience."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 py-4">
            {reasons.map((reason) => (
              <label
                key={reason.value}
                className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all duration-200 ${
                  selectedReason === reason.value
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/40 hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  name="remove-reason"
                  value={reason.value}
                  checked={selectedReason === reason.value}
                  onChange={() => setSelectedReason(reason.value)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm font-medium">{reason.label}</span>
              </label>
            ))}

            {selectedReason === "other" && (
              <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <Label htmlFor="other-reason" className="sr-only">
                  {language === "ar" ? "أخبرنا المزيد" : "Tell us more"}
                </Label>
                <textarea
                  id="other-reason"
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  placeholder={
                    language === "ar" ? "أخبرنا المزيد..." : "Tell us more..."
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                  rows={3}
                />
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => handleDeleteDialogClose(false)}
            >
              {language === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              disabled={!selectedReason || isSubmitting}
              onClick={() => void handleRemoveConfirm()}
              className="transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              {isSubmitting
                ? language === "ar"
                  ? "جاري الإزالة..."
                  : "Removing..."
                : language === "ar"
                  ? "تأكيد الإزالة"
                  : "Confirm Removal"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showPhoneDialog} onOpenChange={handlePhoneDialogChange}>
        <DialogContent
          hideCloseButton
          className="sm:max-w-[380px] border border-border/60 bg-background p-0 shadow-xl"
        >
          <DialogTitle className="sr-only">
            {language === "ar" ? "رقم الهاتف" : "Phone Number"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {language === "ar"
              ? isPhone
                ? "انقر على الرقم للاتصال بالبائع مباشرة"
                : "انقر على الرقم لنسخه"
              : isPhone
                ? "Click the number to call the seller directly"
                : "Click the number to copy it"}
          </DialogDescription>
          <div className="flex flex-col">
            <div className="border-b border-border/60 px-6 pb-5 pt-6 text-center">
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                {language === "ar" ? "رقم الهاتف" : "Phone Number"}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {!hasPhoneNumber
                  ? unavailablePhoneMessage
                  : isPhone
                  ? language === "ar"
                    ? "انقر على الرقم للاتصال بالبائع مباشرة"
                    : "Tap the number below to call the seller directly"
                  : language === "ar"
                    ? "انقر على الرقم لنسخه"
                    : "Click the number to copy it to clipboard"}
              </p>
            </div>

            <div className="px-6 py-6">
              <a
                href={hasPhoneNumber && isPhone ? `tel:${phoneNumber}` : "#"}
                onClick={(e) => void handlePhoneClick(e)}
                aria-label={
                  !hasPhoneNumber
                    ? language === "ar"
                      ? "رقم الهاتف غير متوفر"
                      : "Phone number unavailable"
                    : isPhone
                    ? language === "ar"
                      ? `اتصل الآن ${phoneNumber}`
                      : `Call now ${phoneNumber}`
                    : language === "ar"
                      ? `نسخ الرقم ${phoneNumber}`
                      : `Copy number ${phoneNumber}`
                }
                className={`flex min-h-16 w-full items-center justify-center rounded-2xl border px-6 py-4 text-center transition-all duration-300 ${
                  !hasPhoneNumber
                    ? "cursor-not-allowed border-border bg-muted/30 text-muted-foreground"
                    : copied
                    ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400"
                    : "cursor-pointer border-border bg-muted/30 text-foreground hover:bg-muted/50"
                }`}
                dir="ltr"
              >
                <div className="flex flex-col items-center font-sans">
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    {copied
                      ? language === "ar"
                        ? "✓ تم النسخ"
                        : "✓ Copied!"
                      : language === "ar"
                        ? "رقم البائع"
                        : "Seller Phone"}
                  </span>
                  <span className="mt-1 text-2xl font-bold tracking-tight">
                    {phoneNumber || unavailablePhoneLabel}
                  </span>
                  {hasPhoneNumber && !isPhone && !copied && (
                    <span className="mt-1.5 text-xs text-muted-foreground/70">
                      {language === "ar"
                        ? "انقر للنسخ"
                        : "Click to copy"}
                    </span>
                  )}
                </div>
              </a>

              <Button
                variant="ghost"
                className="mt-3 w-full font-medium text-muted-foreground hover:text-foreground"
                onClick={() => handlePhoneDialogChange(false)}
              >
                {language === "ar" ? "رجوع" : "Go Back"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
