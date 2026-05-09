import { useState } from "react";
import { Share2, Copy, Check, X } from "lucide-react";
import { Button } from "../../../shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../shared/ui/dialog";
import type { Language } from "../../../types";

interface ShareListingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postTitle: string;
  postUrl: string;
  language: Language;
}

const COPY = {
  en: {
    title: "Share this listing",
    description: "Share with friends or on social media",
    copyLink: "Copy Link",
    copied: "Copied!",
    whatsapp: "WhatsApp",
    facebook: "Facebook",
    twitter: "X (Twitter)",
    close: "Close",
  },
  ar: {
    title: "مشاركة هذا الإعلان",
    description: "شارك مع الأصدقاء أو على وسائل التواصل",
    copyLink: "نسخ الرابط",
    copied: "تم النسخ!",
    whatsapp: "واتساب",
    facebook: "فيسبوك",
    twitter: "إكس (تويتر)",
    close: "إغلاق",
  },
};

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function ShareListingDialog({
  open,
  onOpenChange,
  postTitle,
  postUrl,
  language,
}: ShareListingDialogProps) {
  const [copied, setCopied] = useState(false);
  const copy = COPY[language];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement("textarea");
      textarea.value = postUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const encodedTitle = encodeURIComponent(postTitle);
  const encodedUrl = encodeURIComponent(postUrl);

  const shareLinks = [
    {
      key: "whatsapp",
      label: copy.whatsapp,
      icon: <WhatsAppIcon className="h-5 w-5" />,
      color: "bg-green-500 hover:bg-green-600",
      url: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      key: "facebook",
      label: copy.facebook,
      icon: <FacebookIcon className="h-5 w-5" />,
      color: "bg-blue-600 hover:bg-blue-700",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      key: "twitter",
      label: copy.twitter,
      icon: <XIcon className="h-5 w-5" />,
      color: "bg-black hover:bg-gray-800",
      url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            {copy.title}
          </DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Social buttons */}
          <div className="grid grid-cols-3 gap-3">
            {shareLinks.map((link) => (
              <a
                key={link.key}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex flex-col items-center gap-2 rounded-xl p-4 text-white transition-all hover:scale-105 active:scale-95 ${link.color}`}
              >
                {link.icon}
                <span className="text-xs font-medium">{link.label}</span>
              </a>
            ))}
          </div>

          {/* Copy link */}
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 p-3">
            <input
              type="text"
              value={postUrl}
              readOnly
              className="flex-1 bg-transparent text-sm text-foreground truncate outline-none"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="shrink-0 gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-500" />
                  {copy.copied}
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  {copy.copyLink}
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="gap-1.5"
          >
            <X className="h-4 w-4" />
            {copy.close}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
