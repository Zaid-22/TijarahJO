import { useEffect, useMemo, useState } from "react";
import { PostActionDialogs } from "../PostActionDialogs";
import { PostDetailsHeader } from "../PostDetailsHeader";
import { PostImageGallery } from "../PostImageGallery";
import { PostSellerSidebar } from "../PostSellerSidebar";
import { PostSummaryCard } from "../PostSummaryCard";
import { PostCommentsSection } from "../components/PostCommentsSection";
import { SimilarItemsSection } from "../SimilarItemsSection";
import { ReportPostDialog } from "../../marketplace/components/ReportPostDialog";
import { ShareListingDialog } from "../../marketplace/components/ShareListingDialog";
import {
  countActiveListings,
  formatMemberSince,
  formatPostedAgo,
  resolveDisplayLocationLabel,
} from "../postDetailsUtils";
import { Post, Language } from "../../../types";
import { translations } from "../../../translations";
import { api } from "../../../services/api";
import { normalizeSellerDisplayName } from "../../../utils/sellerDisplayName";
import { logger } from "../../../shared/lib/logger";
import { PageShell } from "../../../shared/ui/page-shell";
import { Breadcrumbs } from "../../../shared/ui/breadcrumbs";

import type {
  UpdatePostInput,
  UpdatePostStatusInput,
} from "../../../app/routes/usePostActions";

interface PostDetailsPageProps {
  post: Post;
  onBack: () => void;
  allPosts?: Post[];
  language: Language;
  onPostClick?: (postId: string) => void;
  onCategoryClick?: (categoryName: string) => void;
  onSellerClick?: () => void;
  onUpdatePost?: (post: UpdatePostInput) => void | Promise<void>;
  onUpdatePostStatus?: (
    statusData: UpdatePostStatusInput,
  ) => void | Promise<void>;
  onDeletePost?: (postId: string) => void | Promise<void>;
  isOwnPost?: boolean;
  onChatWithSeller?: () => void;
  favoriteIds?: string[];
  onFavoriteToggle?: (postId: string) => void;
  isAuthenticated?: boolean;
  onRequireAuth?: () => void;
}

export function PostDetailsPage({
  post,
  onBack,
  allPosts,
  language,
  onPostClick,
  onCategoryClick,
  onSellerClick,
  onUpdatePost,
  onUpdatePostStatus,
  onDeletePost,
  isOwnPost,
  onChatWithSeller,
  favoriteIds = [],
  onFavoriteToggle,
  isAuthenticated = false,
  onRequireAuth,
}: PostDetailsPageProps) {
  type ActiveDialog = "delete" | "edit" | "phone" | "report" | "share" | null;
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const [sellerJoinDate, setSellerJoinDate] = useState<string | null>(null);
  const [sellerAvatar, setSellerAvatar] = useState<string | null>(null);
  const [sellerPhone, setSellerPhone] = useState<string | null>(null);
  const [sellerName, setSellerName] = useState<string | null>(null);
  const [sellerCity, setSellerCity] = useState<string | null>(null);
  const [sellerArea, setSellerArea] = useState<string | null>(null);
  const [sellerActiveListingsCount, setSellerActiveListingsCount] = useState<number | null>(null);
  const [sellerAverageRating, setSellerAverageRating] = useState<number | null>(
    null,
  );
  const [sellerReviewCount, setSellerReviewCount] = useState<number>(0);
  const [isSellerLoading, setIsSellerLoading] = useState<boolean>(true);
  const [displayedViews, setDisplayedViews] = useState<number>(post.views ?? 0);
  const [nowTimestamp, setNowTimestamp] = useState<number>(() => Date.now());

  const t = translations[language];
  const isRTL = language === "ar";

  useEffect(() => {
    setDisplayedViews(post.views ?? 0);

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [post.id, post.views]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowTimestamp(Date.now());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (post.id) {
      api.posts
        .trackView(post.id)
        .then((tracked) => {
          if (tracked && !cancelled) {
            setDisplayedViews((prev) => prev + 1);
          }
        })
        .catch(() => {
          // Fire-and-forget analytics should not block UI.
        });
    }

    return () => {
      cancelled = true;
    };
  }, [post.id]);

  useEffect(() => {
    let cancelled = false;

    const fetchSellerData = async () => {
      setIsSellerLoading(true);
      setSellerJoinDate(null);
      setSellerAvatar(null);
      setSellerPhone(null);
      setSellerName(null);
      setSellerCity(null);
      setSellerArea(null);
      setSellerActiveListingsCount(null);
      setSellerAverageRating(null);
      setSellerReviewCount(0);

      if (!post.sellerId) {
        setIsSellerLoading(false);
        return;
      }

      try {
        const user = await api.users.getUser(String(post.sellerId));
        if (cancelled || !user) {
          return;
        }

        const joinDate = user?.joinedAt;
        const avatar = user?.avatar;
        const phone = user?.phone;
        let city = user?.city || null;
        let area = user?.area || null;

        const firstName = user?.firstName || "";
        const lastName = user?.lastName || "";
        const fullName = user?.name || `${firstName} ${lastName}`.trim();
        const email = user?.email || "";

        if (fullName || email) {
          setSellerName(
            normalizeSellerDisplayName(
              fullName || email,
              String(post.sellerId),
            ),
          );
        }

        if (joinDate) {
          setSellerJoinDate(joinDate);
        }

        if (avatar) {
          setSellerAvatar(avatar);
        }

        if (phone) {
          setSellerPhone(phone);
        }

        try {
          const reviewList = await api.reviews.getUserReviews(String(post.sellerId));
          if (!cancelled) {
            const validRatings = reviewList
              .map((review) => Number(review.Rating ?? review.rating ?? 0))
              .filter((rating) => Number.isFinite(rating) && rating > 0);

            if (validRatings.length > 0) {
              const averageRating =
                validRatings.reduce((sum, rating) => sum + rating, 0) /
                validRatings.length;
              setSellerAverageRating(averageRating);
              setSellerReviewCount(validRatings.length);
            }
          }
        } catch {
          // Rating is supplementary seller metadata; ignore if the reviews call fails.
        }

        try {
          const sellerProfileResponse = await api.sellers.getSellerProfile(
            String(post.sellerId),
          );
          const sellerProfile = sellerProfileResponse?.seller;
          if (sellerProfile) {
            const sellerProfilePhone = String(sellerProfile.phone || "").trim();
            if (!phone && sellerProfilePhone && !cancelled) {
              setSellerPhone(sellerProfilePhone);
            }
            if (!avatar && sellerProfile.avatar) {
              setSellerAvatar(String(sellerProfile.avatar));
            }
            if (!city) city = sellerProfile.city || city;
            if (!area) area = sellerProfile.area || area;
            if (typeof sellerProfile.activeListingsCount === "number" && !cancelled) {
              setSellerActiveListingsCount(sellerProfile.activeListingsCount);
            }
          }
        } catch {
          // Keep existing location fallback behavior if seller profile fetch fails.
        }

        if (city) {
          setSellerCity(String(city));
        }

        if (area) {
          setSellerArea(String(area));
        }
      } catch (error) {
        logger.warn("[PostDetailsPage] Failed to fetch seller data:", error);
      } finally {
        if (!cancelled) {
          setIsSellerLoading(false);
        }
      }
    };

    void fetchSellerData();

    return () => {
      cancelled = true;
    };
  }, [post.sellerId]);

  const isFavorited = favoriteIds.includes(post.id);
  const publicSellerName = normalizeSellerDisplayName(
    sellerName || post.seller,
    String(post.sellerId || ""),
  );

  const displayLocationLabel = useMemo(() => {
    const isArabic = language === "ar";
    const resolvedPostLocation = isArabic ? (post.locationAr || post.location) : post.location;
    const resolvedPostArea = isArabic ? (post.areaAr || post.area) : post.area;

    return resolveDisplayLocationLabel({
      postArea: resolvedPostArea,
      postLocation: resolvedPostLocation,
      sellerArea,
      sellerCity,
      jordanLabel: t.jordan || (isArabic ? "الأردن" : "Jordan"),
    });
  }, [post.area, post.areaAr, post.location, post.locationAr, sellerArea, sellerCity, t.jordan, language]);

  const clientSideActiveCount = useMemo(
    () => countActiveListings(allPosts, post),
    [allPosts, post],
  );
  const activeListingsCount = sellerActiveListingsCount ?? clientSideActiveCount;

  const postedAgoLabel = useMemo(
    () =>
      formatPostedAgo(post.createdAt, nowTimestamp, language, t.postedDaysAgo),
    [post.createdAt, nowTimestamp, language, t.postedDaysAgo],
  );
  const memberSinceLabel = useMemo(
    () => formatMemberSince(sellerJoinDate),
    [sellerJoinDate],
  );
  const hasOwnerActions = Boolean(isOwnPost && onUpdatePost && onDeletePost);

  return (
    <PageShell>
      <PostDetailsHeader
        post={post}
        language={language}
        isRTL={isRTL}
        isAuthenticated={isAuthenticated}
        isOwnPost={isOwnPost}
        isFavorited={isFavorited}
        onBack={onBack}
        onFavoriteToggle={onFavoriteToggle}
        onRequireAuth={onRequireAuth}
        onShare={() => setActiveDialog("share")}
        onReport={() => setActiveDialog("report")}
        backToListingsLabel={t.backToListings}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Breadcrumbs — navigation context for deep-linked users */}
        <Breadcrumbs
          isRTL={isRTL}
          className="mb-4"
          items={[
            {
              label: isRTL ? "الرئيسية" : "Home",
              onClick: onBack,
            },
            ...(post.category
              ? [
                  {
                    label: post.category,
                    onClick: onCategoryClick
                      ? () => onCategoryClick(post.category)
                      : undefined,
                  },
                ]
              : []),
            { label: post.name },
          ]}
        />

        <div className="grid min-w-0 grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
          <div className="min-w-0 space-y-6 lg:col-span-2">
            <PostImageGallery post={post} />

            <PostSummaryCard
              post={post}
              isRTL={isRTL}
              displayLocationLabel={displayLocationLabel}
              postedAgoLabel={postedAgoLabel}
              displayedViews={displayedViews}
              labels={{
                descriptionTitle: t.descriptionTitle,
                readMore: t.readMore,
                showLess: t.showLess,
                soldOut: t.soldOut,
                views: t.views,
              }}
            />

            <PostCommentsSection
              postId={post.id}
              language={language}
              postOwnerId={post.sellerId}
              labels={{
                commentsTitle: t.commentsTitle,
                addComment: t.addComment,
                commentPlaceholder: t.commentPlaceholder,
                submitComment: t.submitComment,
                noComments: t.noComments,
                deleteComment: t.deleteComment,
                loadMoreComments: t.loadMoreComments,
                loginToComment: t.loginToComment,
                commentAdded: t.commentAdded,
                commentDeleted: t.commentDeleted,
                reply: t.reply,
                hideReplies: t.hideReplies,
                showReplies: t.showReplies,
                editComment: t.editComment,
                cancelEdit: t.cancelEdit,
                saveComment: t.saveComment,
                commentUpdated: t.commentUpdated,
                replies: t.replies,
              }}
            />
          </div>

          <PostSellerSidebar
            language={language}
            isRTL={isRTL}
            post={post}
            isLoading={isSellerLoading}
            publicSellerName={publicSellerName}
            sellerAvatar={sellerAvatar}
            memberSinceLabel={memberSinceLabel}
            activeListingsCount={activeListingsCount}
            sellerAverageRating={sellerAverageRating}
            sellerReviewCount={sellerReviewCount}
            onSellerClick={onSellerClick}
            onChatWithSeller={onChatWithSeller}
            onShowPhoneDialog={() => setActiveDialog("phone")}
            onShowEditDialog={() => setActiveDialog("edit")}
            onShowDeleteDialog={() => setActiveDialog("delete")}
            hasOwnerActions={hasOwnerActions}
            labels={{
              memberSinceShort: t.memberSinceShort,
              activeListingsShort: t.activeListingsShort,
              items: t.items,
              removePost: t.removePost,
              viewMyProfile: t.viewMyProfile,
              soldOut: t.soldOut,
              callSeller: t.callSeller,
              viewSellerProfile: t.viewSellerProfile,
              chatWithSeller: t.chatWithSeller,
              postSoldMessage: t.postSoldMessage,
              editPost: t.editPost,
              reviewCountWord: language === "ar" ? "تقييم" : "reviews",
              noReviews: language === "ar" ? "لا توجد تقييمات بعد." : "No reviews yet.",
            }}
          />
        </div>
      </div>

      {/* Similar Posts & More from Seller */}
      <SimilarItemsSection
        currentPost={post}
        allPosts={allPosts}
        language={language}
        isAuthenticated={isAuthenticated}
        favoriteIds={favoriteIds}
        onFavoriteToggle={onFavoriteToggle}
        onPostClick={onPostClick}
        onRequireAuth={onRequireAuth}
      />

      <PostActionDialogs
        language={language}
        isRTL={isRTL}
        post={post}
        sellerPhone={sellerPhone}
        showEditDialog={activeDialog === "edit"}
        setShowEditDialog={(open) => setActiveDialog(open ? "edit" : null)}
        showDeleteDialog={activeDialog === "delete"}
        setShowDeleteDialog={(open) => setActiveDialog(open ? "delete" : null)}
        showPhoneDialog={activeDialog === "phone"}
        setShowPhoneDialog={(open) => setActiveDialog(open ? "phone" : null)}
        onUpdatePost={onUpdatePost}
        onUpdatePostStatus={onUpdatePostStatus}
        onDeletePost={onDeletePost}
      />

      {/* Report Listing Dialog */}
      {!isOwnPost && isAuthenticated && (
        <ReportPostDialog
          open={activeDialog === "report"}
          onOpenChange={(open) => setActiveDialog(open ? "report" : null)}
          postId={post.id}
          postTitle={post.name}
          language={language}
        />
      )}

      {/* Share Dialog */}
      <ShareListingDialog
        open={activeDialog === "share"}
        onOpenChange={(open) => setActiveDialog(open ? "share" : null)}
        postTitle={post.name}
        postUrl={typeof window !== "undefined" ? window.location.href : ""}
        language={language}
      />
    </PageShell>
  );
}
