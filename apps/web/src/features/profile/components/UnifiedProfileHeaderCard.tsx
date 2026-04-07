import { useState } from "react";
import {
  Calendar,
  Edit,
  MapPin,
  MessageSquare,
  Phone,
  Settings,
  Star,
} from "lucide-react";
import { resolveAvatarSrc, getAvatarInitial } from "../../../shared/lib/avatar";
import { Avatar, AvatarFallback, AvatarImage } from "../../../shared/ui/avatar";
import { Button } from "../../../shared/ui/button";
import type { UnifiedProfileViewModel } from "../types";
import type { UnifiedProfileLabels } from "./unifiedProfileLabels";

interface UnifiedProfileHeaderCardProps {
  viewModel: UnifiedProfileViewModel;
  labels: UnifiedProfileLabels;
  averageRating: string;
  joinYear: number | string;
  onSettingsClick?: () => void;
  onEditProfileClick?: () => void;
  onChatWithSeller?: () => void;
}

export function UnifiedProfileHeaderCard({
  viewModel,
  labels,
  averageRating,
  joinYear,
  onSettingsClick,
  onEditProfileClick,
  onChatWithSeller,
}: UnifiedProfileHeaderCardProps) {
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const avatarSrc = resolveAvatarSrc(viewModel.profile.avatar);
  const shouldShowAvatarImage = Boolean(avatarSrc) && !avatarLoadFailed;

  return (
    <div className="mb-8 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="relative h-32 w-full bg-gradient-to-br from-primary to-secondary sm:h-48">
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="relative px-6 pb-6">
        <div className="-mt-8 flex flex-col items-center gap-6 sm:-mt-10 md:flex-row md:items-end">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-background bg-card shadow-md sm:h-32 sm:w-32">
              {shouldShowAvatarImage ? (
                <AvatarImage
                  src={avatarSrc || undefined}
                  className="object-cover object-center"
                  alt={viewModel.profile.name || labels.userLabel}
                  onError={() => setAvatarLoadFailed(true)}
                />
              ) : null}
              <AvatarFallback className="bg-card text-3xl font-bold text-primary sm:text-4xl">
                {getAvatarInitial(viewModel.profile.name)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="mb-2 flex-1 text-center md:text-left">
            <h1 className="mb-2 text-2xl font-bold leading-tight text-foreground sm:text-3xl">
              {viewModel.profile.name || `${labels.userLabel} ${viewModel.profileUserId}`}
            </h1>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground md:justify-start">
              <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{viewModel.profile.location || labels.jordan}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1">
                <Calendar className="h-4 w-4 text-primary" />
                <span>
                  {labels.joined} {joinYear}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-medium text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
                <Star className="h-4 w-4 fill-current" />
                <span>
                  {averageRating}{" "}
                  <span className="text-sm font-medium text-muted-foreground">
                    ({viewModel.reviews.length} {labels.reviewCountWord})
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="mb-2 flex flex-wrap justify-center gap-3">
            {viewModel.canEditProfile && onSettingsClick ? (
              <Button
                variant="outline"
                className="rounded-xl bg-background/90 shadow-sm backdrop-blur-sm"
                onClick={onSettingsClick}
              >
                <Settings className="me-2 h-4 w-4" />
                {labels.settings}
              </Button>
            ) : null}

            {viewModel.canEditProfile && onEditProfileClick ? (
              <Button
                className="rounded-xl bg-primary shadow-sm hover:bg-primary/90"
                onClick={onEditProfileClick}
              >
                <Edit className="me-2 h-4 w-4" />
                {labels.editProfile}
              </Button>
            ) : null}

            {viewModel.canChat && onChatWithSeller ? (
              <Button
                className="h-12 rounded-[14px] bg-primary px-5 text-base font-semibold text-primary-foreground shadow-xl hover:bg-primary/92"
                onClick={onChatWithSeller}
              >
                <MessageSquare className="me-2 h-4.5 w-4.5 text-primary-foreground/90" />
                {labels.chatWithSeller}
              </Button>
            ) : null}

            {viewModel.canCall ? (
              <Button
                variant="outline"
                className="h-12 rounded-[14px] border border-slate-300 bg-white px-5 text-base font-medium text-slate-700 shadow-md backdrop-blur-sm hover:bg-slate-50 hover:text-slate-800 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                disabled={!viewModel.profile.phone?.trim()}
                onClick={() => {
                  if (!viewModel.profile.phone?.trim()) {
                    return;
                  }
                  window.location.href = `tel:${viewModel.profile.phone}`;
                }}
              >
                <Phone className="me-2 h-4.5 w-4.5 text-slate-500 dark:text-slate-400" />
                {viewModel.mode === "owner" ? labels.call : labels.callSeller}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
