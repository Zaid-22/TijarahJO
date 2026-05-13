import { useState, useMemo } from "react";
import { toast } from "sonner";
import { api } from "../../../services/api";
import { PageShell } from "../../../shared/ui/page-shell";
import { SubpageHeader } from "../../../shared/ui/subpage-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../shared/ui/alert-dialog";
import { Dialog } from "../../../shared/ui/dialog";
import { EditPostDialog } from "../../marketplace/components/EditPostDialog";
import { ReportPostDialog } from "../../marketplace/components/ReportPostDialog";
import { toPositiveIntegerId } from "../../../utils/idValidation";
import type { Language } from "../../../translations";
import type { Post, ViewMode } from "../../../types";
import type { UpdatePostInput } from "../../../app/routes/usePostActions";
import type { UnifiedProfileViewModel, UnifiedProfileReview } from "../types";
import { UnifiedProfileHeaderCard } from "./UnifiedProfileHeaderCard";
import { UnifiedProfileListingCard } from "./UnifiedProfileListingCard";
import { UnifiedProfileTabs } from "./UnifiedProfileTabs";
import { buildUnifiedProfileLabels } from "./unifiedProfileLabels";
import { useLocationOptions } from "../../../shared/hooks/useLocationOptions";

interface UnifiedProfilePageProps {
  language: Language;
  isLoading?: boolean;
  viewModel: UnifiedProfileViewModel;
  isAuthenticated: boolean;
  favoriteIds?: string[];
  currentUserId?: string;
  onBack: () => void;
  backLabel: string;
  title: string;
  loadingLabel: string;
  onFavoriteToggle?: (postId: string) => void;
  onPostClick?: (postId: string) => void;
  onSettingsClick?: () => void;
  onEditProfileClick?: () => void;
  onAddPostClick?: () => void;
  onChatWithSeller?: () => void;
  onDeletePost?: (postId: string) => void | Promise<void>;
  onUpdatePost?: (post: UpdatePostInput) => void | Promise<void>;
  onReload?: () => void | Promise<void>;
}

export function UnifiedProfilePage({
  language,
  isLoading = false,
  viewModel,
  isAuthenticated,
  favoriteIds = [],
  currentUserId,
  onBack,
  backLabel,
  title,
  loadingLabel,
  onFavoriteToggle,
  onPostClick,
  onSettingsClick,
  onEditProfileClick,
  onAddPostClick,
  onChatWithSeller,
  onDeletePost,
  onUpdatePost,
  onReload,
}: UnifiedProfilePageProps) {
  const isRTL = language === "ar";
  const dateLocale = isRTL ? "ar-JO" : "en-US";
  const labels = buildUnifiedProfileLabels(language);
  const { cities, areas } = useLocationOptions(viewModel.profile.city || "", language);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isReportUserOpen, setIsReportUserOpen] = useState(false);
  const [reviewToReport, setReviewToReport] = useState<UnifiedProfileReview | null>(null);
  const listingViewMode: ViewMode = "list";

  const averageRating =
    viewModel.reviews.length > 0
      ? (
          viewModel.reviews.reduce((acc, review) => acc + review.rating, 0) /
          viewModel.reviews.length
        ).toFixed(1)
      : labels.newSeller;

  const parsedJoinDate = viewModel.profile.joinedDate
    ? new Date(viewModel.profile.joinedDate)
    : null;
  const joinDateDisplay =
    parsedJoinDate && !Number.isNaN(parsedJoinDate.getTime())
      ? new Intl.DateTimeFormat(dateLocale, { month: "short", year: "numeric" }).format(parsedJoinDate)
      : "2024";

  const handleReviewSubmit = async () => {
    if (!viewModel.canReview || !isAuthenticated) {
      toast.error(labels.loginToReview);
      return;
    }
    if (!comment.trim()) {
      toast.error(labels.writeComment);
      return;
    }

    setIsSubmittingReview(true);
    try {
      const reviewedUserId = toPositiveIntegerId(viewModel.profileUserId);
      if (!reviewedUserId) {
        toast.error(labels.invalidSeller);
        return;
      }

      const response = await api.reviews.addReview({
        reviewedUserId,
        rating,
        comment: comment.trim(),
      });

      if (response.success) {
        toast.success(labels.reviewSubmitted);
        setComment("");
        await onReload?.();
      } else {
        toast.error(response.message || labels.reviewFailed);
      }
    } catch {
      toast.error(labels.reviewError);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete || !onDeletePost) {
      setPostToDelete(null);
      return;
    }

    await onDeletePost(postToDelete);
    setPostToDelete(null);
    await onReload?.();
  };

  const handleUpdatePost = async (updatedPost: UpdatePostInput) => {
    if (!onUpdatePost) {
      setPostToEdit(null);
      return;
    }

    await onUpdatePost(updatedPost);
    setPostToEdit(null);
    await onReload?.();
  };

  const displayLocation = useMemo(() => {
    if (!viewModel.profile.city && !viewModel.profile.area) {
      return viewModel.profile.location || labels.jordan;
    }

    let localizedCity = viewModel.profile.city || "";
    if (cities.length > 0 && localizedCity) {
      const normalizedCity = localizedCity.trim().toLowerCase();
      const cityObj = cities.find(
        (c) =>
          c.cityName.toLowerCase() === normalizedCity ||
          (c.cityNameAr && c.cityNameAr.toLowerCase() === normalizedCity),
      );
      if (cityObj) {
        localizedCity = language === "ar" && cityObj.cityNameAr ? cityObj.cityNameAr : cityObj.cityName;
      }
    }

    let localizedArea = viewModel.profile.area || "";
    if (areas.length > 0 && localizedArea) {
      const normalizedArea = localizedArea.trim().toLowerCase();
      const areaObj = areas.find(
        (a) =>
          a.areaName.toLowerCase() === normalizedArea ||
          (a.areaNameAr && a.areaNameAr.toLowerCase() === normalizedArea),
      );
      if (areaObj) {
        localizedArea = language === "ar" && areaObj.areaNameAr ? areaObj.areaNameAr : areaObj.areaName;
      }
    }

    if (localizedCity && localizedArea) {
      return `${localizedCity}، ${localizedArea}`;
    }
    return localizedCity || localizedArea || viewModel.profile.location || labels.jordan;
  }, [cities, areas, viewModel.profile.city, viewModel.profile.area, viewModel.profile.location, language, labels.jordan]);

  if (isLoading) {
    return (
      <PageShell>
        <SubpageHeader
          onBack={onBack}
          isRTL={isRTL}
          backLabel={backLabel}
          title={title}
          showLogo={false}
        />
        <div className="container mx-auto max-w-6xl px-4 py-6">
          <div className="min-h-96 flex items-center justify-center text-muted-foreground">
            {loadingLabel}
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <SubpageHeader
        onBack={onBack}
        isRTL={isRTL}
        backLabel={backLabel}
        title={title}
        showLogo={false}
      />

      <div className="container mx-auto max-w-6xl px-4 py-6">
        <UnifiedProfileHeaderCard
          viewModel={viewModel}
          labels={labels}
          averageRating={averageRating}
          joinDateDisplay={joinDateDisplay}
          displayLocation={displayLocation}
          onSettingsClick={onSettingsClick}
          onEditProfileClick={onEditProfileClick}
          onChatWithSeller={onChatWithSeller}
          onAddPostClick={onAddPostClick}
          onReportUserClick={isAuthenticated ? () => setIsReportUserOpen(true) : undefined}
        />

        <div className="space-y-6">
          <UnifiedProfileTabs
            labels={labels}
            viewModel={viewModel}
            listingViewMode={listingViewMode}
            averageRating={averageRating}
            rating={rating}
            comment={comment}
            isSubmittingReview={isSubmittingReview}
            onRatingChange={setRating}
            onCommentChange={setComment}
            onReviewSubmit={() => {
              void handleReviewSubmit();
            }}
            onAddPostClick={onAddPostClick}
            renderListingCard={(post) => (
              <UnifiedProfileListingCard
                key={post.id}
                post={post}
                allowManage={viewModel.canManageListings}
                listingViewMode={listingViewMode}
                language={language}
                favoriteIds={favoriteIds}
                isAuthenticated={isAuthenticated}
                currentUserId={currentUserId}
                onFavoriteToggle={onFavoriteToggle}
                onPostClick={onPostClick}
                onEditPost={onUpdatePost ? setPostToEdit : undefined}
                onDeletePost={onDeletePost ? setPostToDelete : undefined}
                labels={labels}
              />
            )}
            dateLocale={dateLocale}
            currentUserId={currentUserId}
            onReportReview={isAuthenticated ? setReviewToReport : undefined}
          />
        </div>
      </div>

      <AlertDialog
        open={postToDelete !== null}
        onOpenChange={() => setPostToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.deletePost}</AlertDialogTitle>
            <AlertDialogDescription>
              {labels.deletePostConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{labels.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void handleDeletePost();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {labels.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={postToEdit !== null} onOpenChange={() => setPostToEdit(null)}>
        {postToEdit ? (
          <EditPostDialog
            post={postToEdit}
            onSave={(updatedPost) => {
              void handleUpdatePost(updatedPost as UpdatePostInput);
            }}
            onCancel={() => setPostToEdit(null)}
            language={language}
          />
        ) : null}
      </Dialog>

      <ReportPostDialog
        open={isReportUserOpen}
        onOpenChange={setIsReportUserOpen}
        language={language}
        reportType="USER"
        targetId={viewModel.profileUserId}
        targetTitle={viewModel.profile.name || viewModel.profileUserId}
      />

      <ReportPostDialog
        open={reviewToReport !== null}
        onOpenChange={(open) => {
          if (!open) setReviewToReport(null);
        }}
        language={language}
        reportType="REVIEW"
        targetId={reviewToReport?.reviewID}
        targetTitle={reviewToReport?.comment?.slice(0, 80) || "Review"}
      />
    </PageShell>
  );
}
