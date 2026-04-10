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
                void onUpdatePost(updatedPost as UpdatePostInput);
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
        <DialogContent 
          hideCloseButton
          className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl"
        >
          <DialogTitle className="sr-only">
            {language === "ar" ? "رقم الهاتف" : "Phone Number"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {language === "ar"
              ? "انقر على الرقم للاتصال بالبائع مباشرة"
              : "Click the number to call the seller directly"}
          </DialogDescription>
          <div className="flex flex-col">
            {/* Header section with subtle background */}
            <div className="bg-muted/30 px-6 pt-8 pb-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                {language === "ar" ? "رقم الهاتف" : "Phone Number"}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {language === "ar"
                  ? "انقر على الرقم للاتصال بالبائع مباشرة"
                  : "Click the number to call the seller directly"}
              </p>
            </div>

            {/* Action section */}
            <div className="px-6 py-6 pb-8">
              <a
                href={`tel:${sellerPhone || post.phone || "962700000000"}`}
                aria-label={
                  language === "ar"
                    ? `اتصل الآن ${sellerPhone || post.phone || "+962 7 0000 0000"}`
                    : `Call now ${sellerPhone || post.phone || "+962 7 0000 0000"}`
                }
                className="group relative flex h-16 w-full items-center justify-between overflow-hidden rounded-2xl bg-primary px-6 text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
                dir="ltr"
              >
                <div className="flex flex-col items-start">
                  <span className="text-xs uppercase tracking-widest opacity-70 font-semibold mb-0.5">
                    {language === "ar" ? "رقم البائع" : "Seller Phone"}
                  </span>
                  <span className="text-2xl font-bold tracking-tight">
                    {sellerPhone || post.phone || "+962 7 0000 0000"}
                  </span>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 transition-transform group-hover:rotate-12">
                  <Phone className="h-5 w-5" />
                </div>
              </a>

              <Button
                variant="ghost"
                className="mt-4 w-full text-muted-foreground hover:text-foreground font-medium"
                onClick={() => setShowPhoneDialog(false)}
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
