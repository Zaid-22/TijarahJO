import { useState } from "react";
import { Phone } from "lucide-react";
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

  return (
    <>
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <EditPostDialog
          post={post}
          onSave={(updatedPost) => {
            if (onUpdatePost) {
              void onUpdatePost(updatedPost);
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

      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="sr-only">
            {language === "ar" ? "رقم الهاتف" : "Phone Number"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {language === "ar"
              ? "انقر على الرقم للاتصال بالبائع"
              : "Click the number to call the seller"}
          </DialogDescription>
          <div className="flex flex-col items-center justify-center space-y-6 p-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-primary/10">
              <Phone className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold">
                {language === "ar" ? "رقم الهاتف" : "Phone Number"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === "ar"
                  ? "انقر على الرقم للاتصال بالبائع"
                  : "Click the number to call the seller"}
              </p>
            </div>
            <a
              href={`tel:${sellerPhone || post.phone || "962700000000"}`}
              aria-label={
                language === "ar"
                  ? `اتصل الآن ${sellerPhone || post.phone || "+962 7 0000 0000"}`
                  : `Call now ${sellerPhone || post.phone || "+962 7 0000 0000"}`
              }
              className="flex h-[4.9rem] w-full items-center justify-between rounded-[22px] bg-primary px-5 text-primary-foreground shadow-[0_22px_50px_-28px_rgba(37,99,235,0.95)] transition-all hover:bg-primary/92 hover:shadow-[0_26px_58px_-28px_rgba(37,99,235,0.98)]"
              dir="ltr"
            >
              <span className="truncate pe-4 text-[1.95rem] font-extrabold tracking-[-0.03em]">
                {sellerPhone || post.phone || "+962 7 0000 0000"}
              </span>
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white/14">
                <Phone className="h-6 w-6" />
              </span>
            </a>
            <div className="flex flex-col sm:flex-row gap-3 w-full pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowPhoneDialog(false)}
              >
                {language === "ar" ? "إغلاق" : "Close"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
