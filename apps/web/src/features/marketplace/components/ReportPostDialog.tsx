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

interface ReportPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postTitle: string;
  language: Language;
}

const REPORT_REASONS_EN = [
  "Spam or misleading",
  "Scam or fraud",
  "Inappropriate content",
  "Wrong category",
  "Duplicate listing",
  "Other",
];

const REPORT_REASONS_AR = [
  "محتوى مضلل أو غير مرغوب فيه",
  "احتيال أو نصب",
  "محتوى غير لائق",
  "فئة خاطئة",
  "إعلان مكرر",
  "أخرى",
];

export function ReportPostDialog({
  open,
  onOpenChange,
  postId: _postId,
  postTitle,
  language,
}: ReportPostDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons = language === "ar" ? REPORT_REASONS_AR : REPORT_REASONS_EN;

  const labels = {
    title: language === "ar" ? "الإبلاغ عن هذا الإعلان" : "Report This Listing",
    subtitle:
      language === "ar"
        ? `الإبلاغ عن "${postTitle}"`
        : `Reporting "${postTitle}"`,
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
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error(labels.error);
      return;
    }

    setIsSubmitting(true);
    // Simulate API call — backend endpoint to be implemented
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success(labels.success);
    setIsSubmitting(false);
    setSelectedReason("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            {reasons.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => setSelectedReason(reason)}
                className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all ${
                  selectedReason === reason
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-muted/50"
                }`}
              >
                {reason}
              </button>
            ))}
          </div>

          <Textarea
            placeholder={labels.placeholder}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
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
