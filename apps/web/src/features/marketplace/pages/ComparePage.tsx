/* eslint-disable max-lines */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, ArrowLeft, Sparkles, AlertTriangle, RefreshCw, Star, Eye, PlayCircle, Video } from "lucide-react";
import { useCompare } from "../../../contexts/CompareContext";
import { useAppSettings } from "../../../contexts/AppSettingsContext";
import { api } from "../../../services/api";
import type { CompareResponse, CompareVideoRecommendationsResponse } from "../../../services/api/compare";
import type { Post } from "../../../types";
import { Avatar, AvatarFallback, AvatarImage } from "../../../shared/ui/avatar";
import { getAvatarInitial, resolveAvatarSrc } from "../../../shared/lib/avatar";
import { CompareResultsSection, type BestForCategory } from "./CompareResultsSection";
import { marketplaceTranslations } from "../translations";
import "./compare.css";

type SellerProfileSnapshot = {
  name?: string;
  avatar?: string;
};

function resolvePositiveNumber(...values: Array<number | undefined>): number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return value;
    }
  }
  return null;
}

function resolveDisplayText(...values: Array<string | undefined | null>): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed && trimmed !== "/" && trimmed !== "-") {
      return trimmed;
    }
  }
  return "";
}

export default function ComparePage() {
  const navigate = useNavigate();
  const { selectedPosts, clearCompare } = useCompare();
  const { language } = useAppSettings();
  const t = marketplaceTranslations[language as keyof typeof marketplaceTranslations] || marketplaceTranslations.en;
  const isRTL = language === "ar";

  const [result, setResult] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeBestFor, setActiveBestFor] = useState<BestForCategory>("Budget");
  const [postDetailsById, setPostDetailsById] = useState<Record<string, Post | null>>({});
  const [sellerProfilesById, setSellerProfilesById] = useState<Record<string, SellerProfileSnapshot | null>>({});
  const [videoRecommendations, setVideoRecommendations] =
    useState<CompareVideoRecommendationsResponse | null>(null);
  const [videoStatus, setVideoStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [videoError, setVideoError] = useState<string | null>(null);
  const [activeVideoPostId, setActiveVideoPostId] = useState<string | null>(null);

  const postIds = useMemo(
    () =>
      selectedPosts
        .map((post) => Number(post.id))
        .filter((postId) => Number.isFinite(postId)),
    [selectedPosts],
  );

  const fetchComparison = useCallback(async () => {
    if (postIds.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.compare.comparePosts(postIds, language);
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to compare posts"
      );
    } finally {
      setLoading(false);
    }
  }, [language, postIds]);

  useEffect(() => {
    if (postIds.length >= 2) {
      void fetchComparison();
    }
  }, [fetchComparison, postIds.length]);

  useEffect(() => {
    let cancelled = false;

    if (selectedPosts.length === 0) {
      setPostDetailsById({});
      return;
    }

    void Promise.all(
      selectedPosts.map(async (post) => {
        try {
          return [post.id, await api.posts.getPost(post.id)] as const;
        } catch {
          return [post.id, null] as const;
        }
      }),
    ).then((entries) => {
      if (!cancelled) {
        setPostDetailsById(Object.fromEntries(entries));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedPosts]);

  useEffect(() => {
    let cancelled = false;
    const sellerIds = Array.from(
      new Set(
        selectedPosts
          .map((post) => postDetailsById[post.id]?.sellerId || post.sellerId)
          .filter((sellerId): sellerId is string => Boolean(sellerId?.trim())),
      ),
    );

    if (sellerIds.length === 0) {
      setSellerProfilesById({});
      return;
    }

    void Promise.all(
      sellerIds.map(async (sellerId) => {
        try {
          const profile = await api.sellers.getSellerProfile(sellerId);
          return [sellerId, profile?.seller ?? null] as const;
        } catch {
          return [sellerId, null] as const;
        }
      }),
    ).then((entries) => {
      if (!cancelled) {
        setSellerProfilesById(Object.fromEntries(entries));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [postDetailsById, selectedPosts]);

  useEffect(() => {
    let cancelled = false;

    if (postIds.length === 0) {
      setVideoRecommendations(null);
      setActiveVideoPostId(null);
      setVideoStatus("idle");
      return;
    }

    setVideoStatus("loading");
    setVideoError(null);

    void api.compare
      .getVideoRecommendations(
        postIds.map((postId) => ({ postId })),
        language,
      )
      .then((data) => {
        if (cancelled) return;
        setVideoRecommendations(data);
        const firstVideo = data.Videos[0];
        setActiveVideoPostId(firstVideo ? String(firstVideo.PostId) : selectedPosts[0]?.id ?? null);
        setVideoStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setVideoRecommendations(null);
        setActiveVideoPostId(selectedPosts[0]?.id ?? null);
        setVideoError(err instanceof Error ? err.message : "Failed to fetch recommended videos");
        setVideoStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [language, postIds, selectedPosts]);

  if (selectedPosts.length < 2) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <Scale className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          {t.noPostsToCompare}
        </h1>
        <p className="max-w-md text-center text-base text-muted-foreground leading-relaxed">
          {t.noPostsToCompareDesc}
        </p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-3 flex items-center gap-2 rounded-xl bg-primary px-7 py-3 text-sm font-semibold text-white transition-all"
        >
          <ArrowLeft className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
          {t.browseListing}
        </button>
      </div>
    );
  }

  const reviewsLabel = language === "ar" ? "تقييمات" : "reviews";
  const noReviewsLabel = language === "ar" ? "0 تقييمات" : "0 reviews";
  const videoByPostId = new Map(
    (videoRecommendations?.Videos ?? []).map((video) => [String(video.PostId), video]),
  );
  const activeVideo = activeVideoPostId ? videoByPostId.get(activeVideoPostId) : undefined;
  const activeVideoPost =
    selectedPosts.find((post) => post.id === activeVideoPostId) ?? selectedPosts[0];

  return (
    <div className="min-h-screen bg-background pb-12" dir={isRTL ? "rtl" : "ltr"}>
      {/* ──────────────── Header ──────────────── */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                {t.compareTitle}
              </h1>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {t.compareSubtitle.replace("{count}", selectedPosts.length.toString())}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              clearCompare();
              navigate("/");
            }}
            className="rounded-xl bg-muted/60 px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors sm:text-sm"
          >
            {t.newComparison}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        {/* ──────────────── Product Overview (Compact Thumbnails) ──────────────── */}
        <div className="compare-section-enter mb-6">
          <div
            className={`grid gap-4 ${
              selectedPosts.length === 2
                ? "grid-cols-1 sm:grid-cols-2"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {selectedPosts.map((post) => {
              const details = postDetailsById[post.id];
              const sellerId = details?.sellerId || post.sellerId || "";
              const sellerProfile = sellerProfilesById[sellerId];
              const title = resolveDisplayText(details?.name, post.name);
              const sellerName = resolveDisplayText(
                sellerProfile?.name,
                post.sellerName,
                details?.seller,
              );
              const sellerAvatar = sellerProfile?.avatar || post.sellerAvatar || null;
              const locationName = resolveDisplayText(details?.location, post.location);
              const areaName = resolveDisplayText(details?.area);
              const displayLocation =
                locationName && areaName ? `${locationName}, ${areaName}` : locationName;
              const views =
                typeof details?.views === "number"
                  ? details.views
                  : typeof post.views === "number"
                    ? post.views
                    : 0;
              const averageRating = resolvePositiveNumber(
                details?.averageRating,
                post.averageRating,
              );
              const reviewCount = resolvePositiveNumber(
                details?.reviewCount,
                post.reviewCount,
              );
              return (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => navigate(`/post/${post.id}`, { state: { fromPath: "/compare" } })}
                  className="compare-card group grid overflow-hidden rounded-2xl border border-border/50 bg-card text-start shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:grid-cols-[minmax(9.5rem,12.5rem)_1fr]"
                  aria-label={`View ${post.name}`}
                >
                  {(details?.image || post.image) ? (
                  <div className="compare-image-container compare-overview-image bg-muted/20">
                    <img
                      src={details?.image || post.image}
                      alt={post.name}
                      className="compare-image"
                    />
                  </div>
                ) : (
                  <div className="compare-image-container compare-overview-image flex items-center justify-center bg-muted/20">
                    <Scale className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                )}
                <div className="flex min-w-0 flex-col gap-2 p-3.5 sm:p-4">
                  <div className="min-w-0 space-y-1">
                    <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground sm:text-base">
                      {title || post.name}
                    </h3>
                    {displayLocation && (
                      <p className="truncate text-sm text-muted-foreground">{displayLocation}</p>
                    )}
                  </div>

                  <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <Avatar className="h-7 w-7 border border-white/70 shadow-sm dark:border-white/10">
                      <AvatarImage
                        src={resolveAvatarSrc(sellerAvatar) || undefined}
                        alt={sellerName || title || post.name}
                      />
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {getAvatarInitial(sellerName || title || post.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{sellerName || "-"}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100/90 px-2 py-1 dark:bg-slate-800/80">
                      <Eye className="h-3.5 w-3.5" />
                      {views.toLocaleString()} {t.views}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-amber-600 dark:text-amber-400">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {averageRating && reviewCount
                        ? `${averageRating.toFixed(1)} (${reviewCount.toLocaleString()} ${reviewsLabel})`
                        : noReviewsLabel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-0.5">
                    <p className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                      {(details?.price ?? post.price) > 0
                        ? `${(details?.price ?? post.price).toLocaleString()} JOD`
                        : "Price not listed"}
                    </p>
                  </div>
                </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ──────────────── Recommended YouTube Videos ──────────────── */}
        <section className="compare-section-enter mb-6 rounded-2xl border border-border/50 bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <Video className="h-5 w-5 text-red-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-foreground">{t.recommendedVideos}</h2>
              <p className="text-sm text-muted-foreground">{t.recommendedVideosDesc}</p>
            </div>
          </div>

          <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={t.recommendedVideos}>
            {selectedPosts.map((post) => {
              const postVideo = videoByPostId.get(post.id);
              const isActive = (activeVideoPostId ?? selectedPosts[0]?.id) === post.id;
              return (
                <button
                  key={post.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveVideoPostId(post.id)}
                  className={`flex min-w-48 max-w-[16rem] shrink-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-start transition-colors ${
                    isActive
                      ? "border-red-500/40 bg-red-500/10 text-foreground"
                      : "border-border/50 bg-background text-muted-foreground"
                  }`}
                >
                  {post.image ? (
                    <img src={post.image} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <PlayCircle className="h-5 w-5" />
                    </div>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{post.name}</span>
                    <span className="block truncate text-xs">
                      {postVideo
                        ? t.videoViews.replace("{count}", postVideo.ViewCount.toLocaleString())
                        : t.watchRelatedVideo}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {videoStatus === "idle" || videoStatus === "loading" ? (
            <div className="flex aspect-video items-center justify-center rounded-xl bg-muted/40 text-sm text-muted-foreground">
              <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
            </div>
          ) : videoStatus === "ready" && !videoRecommendations?.IsConfigured ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
              {t.videoNotConfigured}
            </div>
          ) : videoStatus === "error" && videoError ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-8 text-center text-sm text-destructive">
              {videoError}
            </div>
          ) : activeVideo ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <div className="overflow-hidden rounded-xl border border-border/50 bg-black">
                <iframe
                  title={`${t.watchRelatedVideo}: ${activeVideo.Title}`}
                  src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(activeVideo.VideoId)}`}
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
              <div className="flex flex-col justify-center rounded-xl border border-border/50 bg-muted/15 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {t.recommendedFor}
                </p>
                <h3 className="mt-1 line-clamp-2 text-base font-bold text-foreground">
                  {activeVideoPost?.name}
                </h3>
                <p className="mt-4 line-clamp-3 text-sm font-semibold text-foreground">
                  {activeVideo.Title}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{activeVideo.ChannelTitle}</p>
                <p className="mt-3 text-sm font-semibold text-red-600">
                  {t.videoViews.replace("{count}", activeVideo.ViewCount.toLocaleString())}
                </p>
                <p className="mt-4 text-xs text-muted-foreground">
                  {t.videoSearchUsed}: {activeVideo.SearchQuery}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
              {t.videoUnavailable}
            </div>
          )}
        </section>

        {/* ──────────────── Loading State ──────────────── */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-5 py-20">
            <div className="flex justify-center">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 ring-4 ring-primary/5">
                <Sparkles className="h-10 w-10 text-primary drop-shadow-sm" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-foreground">
                {t.aiAnalyzing}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {t.aiAnalyzingDesc}
              </p>
            </div>
          </div>
        )}

        {/* ──────────────── Error State ──────────────── */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center gap-5 py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-foreground">{error}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {t.pleaseTryAgain}
              </p>
            </div>
            <button
              type="button"
              onClick={fetchComparison}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              {t.retry}
            </button>
          </div>
        )}

        {/* ──────────────── AI Results ──────────────── */}
        {result && !loading && (
          <CompareResultsSection
            result={result}
            selectedPosts={selectedPosts}
            activeBestFor={activeBestFor}
            setActiveBestFor={setActiveBestFor}
          />
        )}
      </div>
    </div>
  );
}
