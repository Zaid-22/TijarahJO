import { useEffect, useMemo, useState } from "react";
import { Flag } from "lucide-react";
import { PostActionDialogs } from "../PostActionDialogs";
import { PostDetailsHeader } from "../PostDetailsHeader";
import { PostImageGallery } from "../PostImageGallery";
import { PostSellerSidebar } from "../PostSellerSidebar";
import { PostSummaryCard } from "../PostSummaryCard";
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
  currentUserDisplayName?: string;
}

export function PostDetailsPage({
  post,
  onBack,
  allPosts,
  language,
  onPostClick,
  onSellerClick,
  onUpdatePost,
  onUpdatePostStatus,
  onDeletePost,
  isOwnPost,
  onChatWithSeller,
  favoriteIds = [],
  onFavoriteToggle,
  isAuthenticated = false,
}: PostDetailsPageProps) {
  type ActiveDialog = "delete" | "edit" | "phone" | "report" | "share" | null;
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const [sellerJoinDate, setSellerJoinDate] = useState<string | null>(null);
  const [sellerAvatar, setSellerAvatar] = useState<string | null>(null);
  const [sellerPhone, setSellerPhone] = useState<string | null>(null);
  const [sellerName, setSellerName] = useState<string | null>(null);
  const [sellerCity, setSellerCity] = useState<string | null>(null);
  const [sellerArea, setSellerArea] = useState<string | null>(null);
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
      setSellerJoinDate(null);
      setSellerAvatar(null);
      setSellerPhone(null);
      setSellerName(null);
      setSellerCity(null);
      setSellerArea(null);

      if (!post.sellerId) {
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

        if (!city && !area) {
          try {
            const sellerProfileResponse = await api.sellers.getSellerProfile(
              String(post.sellerId),
            );
            const sellerProfile = sellerProfileResponse?.seller;
            city = sellerProfile?.city || city;
            area = sellerProfile?.area || area;
          } catch {
            // Keep existing location fallback behavior if seller profile fetch fails.
          }
        }

        if (city) {
          setSellerCity(String(city));
        }

        if (area) {
          setSellerArea(String(area));
        }
      } catch (error) {
        logger.warn("[PostDetailsPage] Failed to fetch seller data:", error);
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

  const displayLocationLabel = useMemo(
    () =>
      resolveDisplayLocationLabel({
        postArea: post.area,
        postLocation: post.location,
        sellerArea,
        sellerCity,
        jordanLabel: t.jordan,
      }),
    [post.area, post.location, sellerArea, sellerCity, t.jordan],
  );

  const activeListingsCount = useMemo(
    () => countActiveListings(allPosts, post),
    [allPosts, post],
  );

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
        onShare={() => setActiveDialog("share")}
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
            ...(post.category ? [{ label: post.category }] : []),
            { label: post.name },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <PostImageGallery post={post} />

            <PostSummaryCard
              post={post}
              isRTL={isRTL}
              displayLocationLabel={displayLocationLabel}
              postedAgoLabel={postedAgoLabel}
              displayedViews={displayedViews}
              labels={{
                descriptionTitle: t.descriptionTitle,
                soldOut: t.soldOut,
                views: t.views,
              }}
            />
          </div>

          <PostSellerSidebar
            language={language}
            isRTL={isRTL}
            post={post}
            publicSellerName={publicSellerName}
            sellerAvatar={sellerAvatar}
            memberSinceLabel={memberSinceLabel}
            activeListingsCount={activeListingsCount}
            displayLocationLabel={displayLocationLabel}
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
              locationTitle: t.locationTitle,
              editPost: t.editPost,
            }}
          />
        </div>
      </div>

      {/* Similar Items & More from Seller */}
      <SimilarItemsSection
        currentPost={post}
        allPosts={allPosts}
        language={language}
        isAuthenticated={isAuthenticated}
        favoriteIds={favoriteIds}
        onFavoriteToggle={onFavoriteToggle}
        onPostClick={onPostClick}
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

      {/* Report button */}
      {!isOwnPost && isAuthenticated && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setActiveDialog("report")}
            className="text-sm text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1.5"
          >
            <Flag className="h-4 w-4" />
            {language === "ar"
              ? "الإبلاغ عن هذا الإعلان"
              : "Report this listing"}
          </button>
        </div>
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
