import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "../../../shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../../shared/ui/dialog";
import { Textarea } from "../../../shared/ui/textarea";
import { toast } from "sonner";
import type { Language } from "../../../types";
import { api } from "../../../services/api";

interface ReportPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId?: string;
  postTitle?: string;
  language: Language;
  reportType?: "LISTING" | "COMMENT" | "USER" | "REVIEW";
  targetId?: number | string;
  targetTitle?: string;
}

const REPORT_REASONS = [
  {
    code: "SPAM",
    en: "Spam or misleading",
    ar: "محتوى مضلل أو غير مرغوب فيه",
  },
  {
    code: "SCAM",
    en: "Scam or fraud",
    ar: "احتيال أو نصب",
  },
  {
    code: "OFFENSIVE",
    en: "Inappropriate content",
    ar: "محتوى غير لائق",
  },
  {
    code: "WRONG_CATEGORY",
    en: "Wrong category",
    ar: "فئة خاطئة",
  },
  {
    code: "DUPLICATE",
    en: "Duplicate listing",
    ar: "إعلان مكرر",
  },
  {
    code: "OTHER",
    en: "Other",
    ar: "أخرى",
  },
] as const;

export function ReportPostDialog({
  open,
  onOpenChange,
  postId,
  postTitle,
  language,
  reportType = "LISTING",
  targetId,
  targetTitle,
}: ReportPostDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resolvedTargetId = targetId ?? postId;
  const resolvedTargetTitle = targetTitle ?? postTitle ?? "";
  const targetLabel =
    reportType === "USER"
      ? language === "ar"
        ? "المستخدم"
        : "User"
      : reportType === "REVIEW"
        ? language === "ar"
          ? "التقييم"
          : "Review"
      : reportType === "COMMENT"
        ? language === "ar"
          ? "التعليق"
          : "Comment"
        : language === "ar"
          ? "الإعلان"
          : "Listing";

  const labels = {
    title:
      language === "ar"
        ? reportType === "USER"
          ? "الإبلاغ عن هذا المستخدم"
          : reportType === "REVIEW"
            ? "الإبلاغ عن هذا التقييم"
          : reportType === "COMMENT"
            ? "الإبلاغ عن هذا التعليق"
            : "الإبلاغ عن هذا الإعلان"
        : reportType === "USER"
          ? "Report This User"
          : reportType === "REVIEW"
            ? "Report This Review"
          : reportType === "COMMENT"
            ? "Report This Comment"
            : "Report This Listing",
    subtitle:
      language === "ar"
        ? `الإبلاغ عن ${targetLabel} "${resolvedTargetTitle}"`
        : `Reporting ${targetLabel.toLowerCase()} "${resolvedTargetTitle}"`,
    selectReason:
      language === "ar" ? "اختر سبب الإبلاغ" : "Select a reason for reporting",
    additionalDetails:
      language === "ar"
        ? "تفاصيل إضافية (اختياري)"
        : "Additional details (optional)",
    placeholder:
      language === "ar"
        ? "اكتب المزيد من التفاصيل هنا..."
        : "Provide more details here...",
    attachImage:
      language === "ar"
        ? "إرفاق صورة دليل (اختياري)"
        : "Attach evidence image (optional)",
    changeImage: language === "ar" ? "تغيير الصورة" : "Change image",
    removeImage: language === "ar" ? "إزالة" : "Remove",
    cancel: language === "ar" ? "إلغاء" : "Cancel",
    submit: language === "ar" ? "إرسال البلاغ" : "Submit Report",
    submitting: language === "ar" ? "جارٍ الإرسال..." : "Submitting...",
    success:
      language === "ar"
        ? "تم إرسال البلاغ بنجاح. شكراً لمساعدتنا!"
        : "Report submitted successfully. Thank you for helping us!",
    error:
      language === "ar"
        ? "يرجى اختيار سبب الإبلاغ"
        : "Please select a reason for the report",
    authError:
      language === "ar"
        ? "يجب تسجيل الدخول قبل إرسال البلاغ."
        : "You need to sign in before submitting a report.",
    submitError:
      language === "ar"
        ? "تعذر إرسال البلاغ حالياً."
        : "Could not submit the report right now.",
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleRemoveImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImage(null);
    setImagePreview(null);
  };

  const resetForm = () => {
    setSelectedReason("");
    setDescription("");
    handleRemoveImage();
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error(labels.error);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await api.reports.submitReport({
        reportType,
        targetId: resolvedTargetId ?? "",
        reason: selectedReason,
        description,
        image,
      });

      if (!result.success) {
        const message = result.message || labels.submitError;
        if (/unauthorized|authentication|sign in|log in/i.test(message)) {
          toast.error(labels.authError);
        } else {
          toast.error(message);
        }
        return;
      }

      toast.success(labels.success);
      resetForm();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" />
            {labels.title}
          </DialogTitle>
          <DialogDescription>{labels.subtitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm font-medium text-foreground">
            {labels.selectReason}
          </p>
          <div className="grid gap-2">
            {REPORT_REASONS.map((reason) => (
              <button
                key={reason.code}
                type="button"
                onClick={() => setSelectedReason(reason.code)}
                className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all ${
                  selectedReason === reason.code
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-muted/50"
                }`}
              >
                {language === "ar" ? reason.ar : reason.en}
              </button>
            ))}
          </div>

          <Textarea
            placeholder={labels.placeholder}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-20"
          />

          {/* Evidence image upload */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {labels.attachImage}
            </p>
            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img
                  src={imagePreview}
                  alt="Evidence preview"
                  className="w-full max-h-48 object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-background/90 border border-border hover:bg-muted transition-colors">
                      {labels.changeImage}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      onChange={handleImageChange}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-destructive/90 text-destructive-foreground hover:bg-destructive transition-colors"
                  >
                    {labels.removeImage}
                  </button>
                </div>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center text-sm text-muted-foreground hover:border-primary/40 hover:bg-muted/30 transition-colors">
                  {language === "ar"
                    ? "انقر لاختيار صورة (JPG، PNG، WebP)"
                    : "Click to choose an image (JPG, PNG, WebP)"}
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => { resetForm(); onOpenChange(false); }}
            disabled={isSubmitting}
          >
            {labels.cancel}
          </Button>
          <Button
            variant="destructive"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || !selectedReason}
          >
            {isSubmitting ? labels.submitting : labels.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
