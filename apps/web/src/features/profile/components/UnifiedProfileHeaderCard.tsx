import {
  Calendar,
  Edit,
  MapPin,
  MessageSquare,
  Phone,
  Settings,
  Star,
} from "lucide-react";
import { resolveAvatarSrc } from "../../../shared/lib/avatar";
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
  return (
    <div className="mb-8 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="relative h-32 w-full bg-gradient-to-br from-primary to-secondary sm:h-48">
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="relative px-6 pb-6">
        <div className="-mt-8 flex flex-col items-center gap-6 sm:-mt-10 md:flex-row md:items-end">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-card shadow-md sm:h-32 sm:w-32">
              <img
                src={resolveAvatarSrc(viewModel.profile.avatar)}
                className="h-full w-full object-cover"
                alt={viewModel.profile.name || labels.userLabel}
              />
            </div>
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
                className="rounded-xl bg-primary shadow-sm hover:bg-primary/90"
                onClick={onChatWithSeller}
              >
                <MessageSquare className="me-2 h-4 w-4" />
                {labels.chatWithSeller}
              </Button>
            ) : null}

            {viewModel.canCall ? (
              <Button
                variant="outline"
                className="rounded-xl bg-background/90 shadow-sm backdrop-blur-sm"
                disabled={!viewModel.profile.phone?.trim()}
                onClick={() => {
                  if (!viewModel.profile.phone?.trim()) {
                    return;
                  }
                  window.location.href = `tel:${viewModel.profile.phone}`;
                }}
              >
                <Phone className="me-2 h-4 w-4" />
                {viewModel.mode === "owner" ? labels.call : labels.callSeller}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
