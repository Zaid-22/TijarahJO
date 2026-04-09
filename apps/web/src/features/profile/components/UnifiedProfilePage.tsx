import { useState } from "react";
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
import { toPositiveIntegerId } from "../../../utils/idValidation";
import type { Language } from "../../../translations";
import type { Post, ViewMode } from "../../../types";
import type { UpdatePostInput } from "../../../app/routes/usePostActions";
import type { UnifiedProfileViewModel } from "../types";
import { UnifiedProfileHeaderCard } from "./UnifiedProfileHeaderCard";
import { UnifiedProfileListingCard } from "./UnifiedProfileListingCard";
import { UnifiedProfileTabs } from "./UnifiedProfileTabs";
import { buildUnifiedProfileLabels } from "./unifiedProfileLabels";

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
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
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
  const joinYear =
    parsedJoinDate && !Number.isNaN(parsedJoinDate.getTime())
      ? parsedJoinDate.getFullYear()
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
          joinYear={joinYear}
          onSettingsClick={onSettingsClick}
          onEditProfileClick={onEditProfileClick}
          onChatWithSeller={onChatWithSeller}
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
              void handleUpdatePost(updatedPost);
            }}
            onCancel={() => setPostToEdit(null)}
            language={language}
          />
        ) : null}
      </Dialog>
    </PageShell>
  );
}
