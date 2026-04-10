import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, ArrowLeft, Sparkles, AlertTriangle, RefreshCw, Star } from "lucide-react";
import { useCompare } from "../../../contexts/CompareContext";
import { useAppSettings } from "../../../contexts/AppSettingsContext";
import { api } from "../../../services/api";
import type { CompareResponse } from "../../../services/api/compare";
import { CompareResultsSection, type BestForCategory } from "./CompareResultsSection";
import { marketplaceTranslations } from "../translations";
import { getLocalizedLocation } from "../../auth/loginUtils";
import "./compare.css";

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

  const postIds = selectedPosts.map((p) => Number(p.id));

  const fetchComparison = async () => {
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
  };

  useEffect(() => {
    if (postIds.length >= 2) {
      fetchComparison();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  if (selectedPosts.length < 2) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-4">
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
                ? "grid-cols-2"
                : "grid-cols-2 sm:grid-cols-3"
            }`}
          >
            {selectedPosts.map((post) => (
              <div
                key={post.id}
                className="compare-card overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm"
              >
                {post.image ? (
                  <div className="compare-image-container bg-muted/20">
                    <img
                      src={post.image}
                      alt={post.name}
                      className="compare-image"
                    />
                  </div>
                ) : (
                  <div className="compare-image-container flex items-center justify-center bg-muted/20">
                    <Scale className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                )}
                <div className="p-3.5 sm:p-4">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground sm:text-base">
                    {post.name}
                  </h3>
                  {post.location && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-[13px]">
                      {getLocalizedLocation(post.location, language)}
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-lg font-extrabold tracking-tight text-primary sm:text-xl">
                      {post.price > 0
                        ? `${post.price.toLocaleString()} JOD`
                        : "Price not listed"}
                    </p>
                    {post.averageRating && post.averageRating > 0 && (
                      <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                        <Star className="h-3 w-3 fill-current" />
                        <span>{post.averageRating.toFixed(1)}</span>
                        {post.reviewCount ? (
                          <span className="opacity-70">({post.reviewCount})</span>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

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
