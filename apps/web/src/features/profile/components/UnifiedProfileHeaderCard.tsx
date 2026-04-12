import { useEffect, useState } from "react";
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

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [avatarSrc]);

  const shouldShowAvatarImage = Boolean(avatarSrc) && !avatarLoadFailed;
  return (
    <div className="mb-8 overflow-hidden">
      <div className="relative px-2 sm:px-4">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start md:items-center">
          {/* Avatar */}
          <div className="relative shrink-0">
            <Avatar className="h-24 w-24 border border-border/40 shadow-sm sm:h-32 sm:w-32 rounded-[28px] overflow-hidden">
              {shouldShowAvatarImage ? (
                <AvatarImage
                  src={avatarSrc || undefined}
                  className="object-cover object-center"
                  alt={viewModel.profile.name || labels.userLabel}
                  onError={() => setAvatarLoadFailed(true)}
                />
              ) : null}
              <AvatarFallback className="bg-primary/5 text-3xl font-bold text-primary sm:text-4xl rounded-[28px]">
                {getAvatarInitial(viewModel.profile.name)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center sm:text-start pt-2">
            <h1 className="mb-3 text-2xl font-bold leading-tight text-foreground sm:text-3xl tracking-tight">
              {viewModel.profile.name || `${labels.userLabel} ${viewModel.profileUserId}`}
            </h1>

            <div className="flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-4 text-sm text-muted-foreground font-medium">
              <div className="flex items-center gap-1.5 rounded-full bg-slate-100/80 px-3.5 py-1.5 dark:bg-slate-800/50">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{viewModel.profile.location || labels.jordan}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-slate-100/80 px-3.5 py-1.5 dark:bg-slate-800/50">
                <Calendar className="h-4 w-4 text-primary" />
                <span>
                  {labels.joined} {joinYear}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3.5 py-1.5 font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                <Star className="h-4 w-4 fill-current" />
                <span>
                  {averageRating}{" "}
                  <span className="font-medium opacity-80 ms-1">
                    ({viewModel.reviews.length})
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex shrink-0 flex-wrap justify-center sm:justify-end gap-3 pt-2">
            {viewModel.canEditProfile && onSettingsClick ? (
              <Button
                variant="outline"
                className="h-11 rounded-[16px] shadow-sm backdrop-blur-sm px-5"
                onClick={onSettingsClick}
              >
                <Settings className="me-2 h-4 w-4" />
                {labels.settings}
              </Button>
            ) : null}

            {viewModel.canEditProfile && onEditProfileClick ? (
              <Button
                className="h-11 rounded-[16px] bg-primary shadow-sm hover:bg-primary/90 px-5"
                onClick={onEditProfileClick}
              >
                <Edit className="me-2 h-4 w-4 text-primary-foreground/90" />
                {labels.editProfile}
              </Button>
            ) : null}

            {viewModel.mode !== "owner" && viewModel.canCall ? (
              <Button
                className="h-[3.25rem] rounded-[18px] bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-xl shadow-blue-500/20 transition-all hover:bg-primary/92 hover:-translate-y-0.5 active:translate-y-0"
                disabled={!viewModel.profile.phone?.trim()}
                onClick={() => {
                  if (!viewModel.profile.phone?.trim()) {
                    return;
                  }
                  window.location.href = `tel:${viewModel.profile.phone}`;
                }}
              >
                <Phone className="me-2 h-4.5 w-4.5 text-primary-foreground/90" />
                {labels.callSeller}
              </Button>
            ) : null}

            {viewModel.mode !== "owner" && viewModel.canChat && onChatWithSeller ? (
              <Button
                variant="outline"
                className="h-[3.25rem] rounded-[18px] border-2 border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0"
                onClick={onChatWithSeller}
              >
                <MessageSquare className="me-2 h-4.5 w-4.5 text-slate-500 transition-colors group-hover:text-slate-700 dark:text-slate-400" />
                {labels.chatWithSeller}
              </Button>
            ) : null}
          </div>
        </div>

        {/* Integrated About Me Section */}
        {viewModel.profile.bio?.trim() && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-foreground mb-3 tracking-tight">{labels.aboutMe}</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {viewModel.profile.bio.trim()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
