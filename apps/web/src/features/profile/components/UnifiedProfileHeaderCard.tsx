import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Edit,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Settings,
  Star,
} from "lucide-react";
import { resolveAvatarSrc, getAvatarInitial } from "../../../shared/lib/avatar";
import { Avatar, AvatarFallback, AvatarImage } from "../../../shared/ui/avatar";
import { Button } from "../../../shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../../../shared/ui/dialog";
import type { UnifiedProfileViewModel } from "../types";
import type { UnifiedProfileLabels } from "./unifiedProfileLabels";

/** Detect if the current device is a phone (capable of making calls). */
function isMobilePhone(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /Android.*Mobile|iPhone|iPod|Windows Phone|BlackBerry|Opera Mini|IEMobile/i.test(
    ua,
  );
}

interface UnifiedProfileHeaderCardProps {
  viewModel: UnifiedProfileViewModel;
  labels: UnifiedProfileLabels;
  averageRating: string;
  joinDateDisplay: string;
  displayLocation?: string;
  onSettingsClick?: () => void;
  onEditProfileClick?: () => void;
  onChatWithSeller?: () => void;
  onAddPostClick?: () => void;
}

export function UnifiedProfileHeaderCard({
  viewModel,
  labels,
  averageRating,
  joinDateDisplay,
  displayLocation,
  onSettingsClick,
  onEditProfileClick,
  onChatWithSeller,
  onAddPostClick,
}: UnifiedProfileHeaderCardProps) {
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);
  const avatarSrc = resolveAvatarSrc(viewModel.profile.avatar);
  const isPhone = useMemo(() => isMobilePhone(), []);
  const phoneNumber = viewModel.profile.phone?.trim() || "";
  const isArabic = labels.jordan === "الأردن"; // infer language from labels

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [avatarSrc]);

  const handlePhoneNumberClick = useCallback(
    async (e: React.MouseEvent) => {
      if (isPhone) return; // let tel: link work
      e.preventDefault();
      if (!phoneNumber) return;
      try {
        await navigator.clipboard.writeText(phoneNumber);
        setPhoneCopied(true);
        setTimeout(() => setPhoneCopied(false), 2000);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = phoneNumber;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setPhoneCopied(true);
        setTimeout(() => setPhoneCopied(false), 2000);
      }
    },
    [isPhone, phoneNumber],
  );

  const handlePhoneDialogClose = (open: boolean) => {
    if (!open) setPhoneCopied(false);
    setShowPhoneDialog(open);
  };

  const shouldShowAvatarImage = Boolean(avatarSrc) && !avatarLoadFailed;
  return (
    <div className="mb-8 overflow-hidden">
      <div className="relative px-2 sm:px-4">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start md:items-center">
          {/* Avatar */}
          <div className="relative shrink-0">
            <Avatar className="h-24 w-24 border border-border/40 shadow-sm sm:h-28 sm:w-28 rounded-full overflow-hidden">
              {shouldShowAvatarImage ? (
                <AvatarImage
                  src={avatarSrc || undefined}
                  className="object-cover object-center"
                  alt={viewModel.profile.name || labels.userLabel}
                  onError={() => setAvatarLoadFailed(true)}
                />
              ) : null}
              <AvatarFallback className="bg-primary/5 text-3xl font-bold text-primary sm:text-4xl rounded-full">
                {getAvatarInitial(viewModel.profile.name)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center sm:text-start pt-2">
            <h1 className="mb-3 text-2xl font-bold leading-tight text-foreground sm:text-3xl tracking-tight">
              {viewModel.profile.name ||
                `${labels.userLabel} ${viewModel.profileUserId}`}
            </h1>

            <div className="flex flex-wrap justify-center sm:justify-start gap-2.5 sm:gap-3 text-xs font-medium">
              <div className="flex items-center gap-1.5 rounded-full bg-slate-100/80 px-3 py-1.5 text-slate-600 transition-colors hover:bg-slate-200/60 dark:bg-slate-800/50 dark:text-slate-300">
                <MapPin className="h-[15px] w-[15px] text-slate-400" />
                <span>
                  {displayLocation ||
                    viewModel.profile.location ||
                    labels.jordan}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-slate-100/80 px-3 py-1.5 text-slate-600 transition-colors hover:bg-slate-200/60 dark:bg-slate-800/50 dark:text-slate-300">
                <Calendar className="h-[15px] w-[15px] text-slate-400" />
                <span>
                  {labels.joined} {joinDateDisplay}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1.5 font-bold text-amber-500 transition-colors hover:bg-amber-500/15 dark:bg-amber-500/20 dark:text-amber-400">
                <Star className="h-[15px] w-[15px] fill-current" />
                <span>
                  {averageRating}{" "}
                  <span className="font-medium opacity-60 ms-0.5">
                    ({viewModel.reviews.length})
                  </span>
                </span>
              </div>
            </div>

            {/* Buyer Actions (Chat / Call) tightly coupled to the user metadata */}
            {viewModel.mode !== "owner" && (
              <div className="mt-5 flex flex-wrap justify-center sm:justify-start gap-3">
                {viewModel.canChat && onChatWithSeller ? (
                  <Button
                    className="flex h-11 min-w-32 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow"
                    onClick={onChatWithSeller}
                  >
                    <MessageCircle className="h-[1.15rem] w-[1.15rem]" />
                    {labels.chatWithSeller}
                  </Button>
                ) : null}

                {viewModel.canCall ? (
                  <Button
                    variant="outline"
                    className="flex h-11 min-w-32 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:disabled:bg-slate-800"
                    disabled={!phoneNumber}
                    onClick={() => setShowPhoneDialog(true)}
                  >
                    <Phone className="h-[1.05rem] w-[1.05rem] text-slate-500 dark:text-slate-400" />
                    {labels.callSeller}
                  </Button>
                ) : null}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex shrink-0 flex-wrap justify-center sm:justify-end gap-3 pt-2">
            {viewModel.canEditProfile && onEditProfileClick ? (
              <Button
                variant="outline"
                className="h-11 rounded-xl shadow-sm backdrop-blur-sm px-5 font-semibold"
                onClick={onEditProfileClick}
              >
                <Edit className="me-2 h-4 w-4" />
                {labels.editProfile}
              </Button>
            ) : null}

            {viewModel.canManageListings && onAddPostClick ? (
              <Button
                className="h-11 rounded-xl bg-primary shadow-sm hover:bg-primary/90 px-6 font-bold"
                onClick={onAddPostClick}
              >
                <Plus
                  className="me-2 h-4 w-4 text-primary-foreground"
                  strokeWidth={2.5}
                />
                {labels.addPost}
              </Button>
            ) : null}

            {viewModel.canEditProfile && onSettingsClick ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={onSettingsClick}
                aria-label={labels.settings}
                title={labels.settings}
              >
                <Settings className="h-5 w-5" />
              </Button>
            ) : null}
          </div>
        </div>

        {/* Integrated About Me Section */}
        {viewModel.profile.bio?.trim() && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-foreground mb-3 tracking-tight">
              {labels.aboutMe}
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {viewModel.profile.bio.trim()}
            </p>
          </div>
        )}
      </div>

      {/* Phone Dialog — same design everywhere */}
      <Dialog open={showPhoneDialog} onOpenChange={handlePhoneDialogClose}>
        <DialogContent
          hideCloseButton
          className="sm:max-w-[380px] border border-border/60 bg-background p-0 shadow-xl"
        >
          <DialogTitle className="sr-only">
            {isArabic ? "رقم الهاتف" : "Phone Number"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isPhone
              ? isArabic
                ? "انقر على الرقم للاتصال بالبائع مباشرة"
                : "Click the number to call the seller directly"
              : isArabic
                ? "انقر على الرقم لنسخه"
                : "Click the number to copy it"}
          </DialogDescription>
          <div className="flex flex-col">
            <div className="border-b border-border/60 px-6 pb-5 pt-6 text-center">
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                {isArabic ? "رقم الهاتف" : "Phone Number"}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {isPhone
                  ? isArabic
                    ? "انقر على الرقم للاتصال بالبائع مباشرة"
                    : "Tap the number below to call the seller directly"
                  : isArabic
                    ? "انقر على الرقم لنسخه"
                    : "Click the number to copy it to clipboard"}
              </p>
            </div>

            <div className="px-6 py-6">
              <a
                href={isPhone ? `tel:${phoneNumber}` : "#"}
                onClick={(e) => void handlePhoneNumberClick(e)}
                aria-label={
                  isPhone
                    ? isArabic
                      ? `اتصل الآن ${phoneNumber}`
                      : `Call now ${phoneNumber}`
                    : isArabic
                      ? `نسخ الرقم ${phoneNumber}`
                      : `Copy number ${phoneNumber}`
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
                      ? isArabic
                        ? "✓ تم النسخ"
                        : "✓ Copied!"
                      : isArabic
                        ? "رقم البائع"
                        : "Seller Phone"}
                  </span>
                  <span className="mt-1 text-2xl font-bold tracking-tight">
                    {phoneNumber}
                  </span>
                  {!isPhone && !phoneCopied && (
                    <span className="mt-1.5 text-xs text-muted-foreground/70">
                      {isArabic ? "انقر للنسخ" : "Click to copy"}
                    </span>
                  )}
                </div>
              </a>

              <Button
                variant="ghost"
                className="mt-3 w-full font-medium text-muted-foreground hover:text-foreground"
                onClick={() => handlePhoneDialogClose(false)}
              >
                {isArabic ? "رجوع" : "Go Back"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
