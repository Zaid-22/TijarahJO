import { useNavigate } from "react-router-dom";
import {
  Scale, ArrowLeft, Sparkles, Layers,
  Trophy, Zap, Home, CheckCircle, XCircle, ListChecks,
  DollarSign, FileText, MessageCircle, Star,
} from "lucide-react";
import type { CompareResponse, PostProsConsDTO, PostFeaturesDTO, PostSummaryDTO } from "../../../services/api/compare";
import type { ComparePost } from "../../../contexts/CompareContext";
import { useAppSettings } from "../../../contexts/AppSettingsContext";
import { marketplaceTranslations } from "../translations";

export type BestForCategory = "Budget" | "Performance" | "DailyUse";

interface CompareResultsSectionProps {
  result: CompareResponse;
  selectedPosts: ComparePost[];
  activeBestFor: BestForCategory;
  setActiveBestFor: (category: BestForCategory) => void;
}

export function CompareResultsSection({
  result,
  selectedPosts,
  activeBestFor,
  setActiveBestFor,
}: CompareResultsSectionProps) {
  const navigate = useNavigate();
  const { language } = useAppSettings();
  const t = marketplaceTranslations[language as keyof typeof marketplaceTranslations] || marketplaceTranslations.en;

  return (
    <div className="space-y-6">
      {/* ── AI Analysis Divider ── */}
      <div className="compare-ai-divider flex items-center gap-3 py-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-0.5">
          <h2 className="text-lg font-bold text-foreground">{t.aiAnalysisResults}</h2>
          <p className="text-sm text-muted-foreground">{t.aiAnalysisDesc}</p>
        </div>
        <div className="flex-1 border-t border-border/40" />
      </div>

      {/* ── Post Summaries ── */}
      {result.PostSummaries && result.PostSummaries.length > 0 && (
        <section className="compare-card rounded-2xl border border-border/50 bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">{t.postOverview}</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {result.PostSummaries.map((ps: PostSummaryDTO, idx: number) => {
              const winnerPost = selectedPosts.find(
                (p: ComparePost) => p.name?.toLowerCase().trim() === ps.PostName?.toLowerCase().trim()
              ) || selectedPosts[0];
              return (
                <div
                  key={idx}
                  className="compare-summary-card relative overflow-hidden rounded-xl border border-indigo-500/15 bg-accent/5 p-5 sm:p-6"
                >
                  <div className="absolute top-0 right-0 h-16 w-16 rounded-bl-4xl bg-indigo-500/5" />
                  <h3 className="line-clamp-2 text-start text-base font-bold leading-snug text-foreground">
                    {winnerPost.name}
                  </h3>
                  <p className="mt-3 text-start text-sm leading-7 text-foreground/80 sm:text-base line-clamp-6">
                    {ps.Summary}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Feature Comparison ── */}
      <section className="compare-card rounded-2xl border border-border/50 bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground">{t.featureDifferences}</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(result.FeatureDifferences || []).map((fd: PostFeaturesDTO, pIdx: number) => (
            <div key={pIdx} className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-5 sm:p-6">
              <h3 className="mb-4 text-base font-bold text-blue-700 dark:text-blue-400">{fd.PostName}</h3>
              <ul className="space-y-3.5">
                {fd.Features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm sm:text-base">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-600 dark:bg-blue-500/30 dark:text-blue-300">
                      {i + 1}
                    </span>
                    <span className="leading-7 text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pros & Cons ── */}
      <section className="compare-card rounded-2xl border border-border/50 bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-primary/10">
            <ListChecks className="h-5 w-5 text-primary" strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-bold text-foreground">{t.prosAndCons}</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {result.ProsCons.map((pc: PostProsConsDTO) => (
            <div key={pc.PostName} className="rounded-xl border border-border/30 bg-muted/10 p-5 sm:p-6">
              <h3 className="mb-4 text-base font-bold text-foreground">{pc.PostName}</h3>
              <div className="rounded-lg bg-emerald-500/6 px-3.5 py-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-600">
                  {t.prosLabel}
                </div>
                <div className="space-y-2.5">
                {pc.Pros.map((pro, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm sm:text-base">
                    <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    <span className="leading-7 text-foreground/80">{pro}</span>
                  </div>
                ))}
              </div>
              </div>
              <div className="mt-4 rounded-lg bg-red-500/5 px-3.5 py-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-500">
                  {t.consLabel}
                </div>
                <div className="space-y-2.5">
                {pc.Cons.map((con, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm sm:text-base">
                    <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                    <span className="leading-7 text-foreground/80">{con}</span>
                  </div>
                ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Best For ── */}
      {result.BestFor && (
        <section className="compare-card rounded-2xl border border-border/50 bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Scale className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">{t.bestForSection || t.bestForLabel}</h2>
          </div>
          <div className="mb-5 flex flex-wrap gap-2.5 sm:gap-3">
            {([
              { key: "Budget" as const, icon: DollarSign, label: t.budgetPick || "Budget", activeColor: "blue" },
              { key: "Performance" as const, icon: Zap, label: t.performancePick || "Performance", activeColor: "blue" },
              { key: "DailyUse" as const, icon: Home, label: t.dailyUsePick || "Daily Use", activeColor: "violet" },
            ]).map(({ key, icon: Icon, label, activeColor }) => (
              <button
                type="button"
                key={key}
                onClick={() => setActiveBestFor(key)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all ${
                  activeBestFor === key
                    ? `border-${activeColor}-500 bg-${activeColor}-500/10 text-${activeColor}-600 dark:bg-${activeColor}-500/20 dark:text-${activeColor}-400`
                    : "border-border/50 bg-background text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label || key}
              </button>
            ))}
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-muted/10 p-5 sm:p-6">
            <p className="text-sm leading-7 text-foreground/90 sm:text-base sm:leading-8">
              {activeBestFor === "Budget" && result.BestFor.Budget}
              {activeBestFor === "Performance" && result.BestFor.Performance}
              {activeBestFor === "DailyUse" && result.BestFor.DailyUse}
            </p>
          </div>
        </section>
      )}

      {/* ── Final Recommendation — Winner Card ── */}
      {result.FinalRecommendation && (
        <section className="compare-card compare-recommendation rounded-2xl border-2 border-primary/30 bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 ring-4 ring-amber-500/5">
              <Trophy className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground sm:text-2xl">{t.winnerAnnouncement}</h2>
              </div>
              <p className="text-sm font-medium text-muted-foreground">{t.aiGeneratedPick}</p>
            </div>
          </div>
          <div className="mb-5 flex items-center gap-4">
            <span className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
              {result.FinalRecommendation.WinnerName}
            </span>
          </div>
          <div className="mb-6 space-y-3">
            <div className="flex items-start gap-2.5 text-sm sm:text-base">
              <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">✔</span>
              <span className="leading-7 text-foreground/90">
                <span className="font-bold text-foreground">{t.bestForLabel}:</span> {result.FinalRecommendation.BestFor}
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-sm sm:text-base">
              <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">✔</span>
              <span className="leading-7 text-foreground/90">
                <span className="font-bold text-foreground">{t.whyLabel}:</span> {result.FinalRecommendation.Reason}
              </span>
            </div>
          </div>
          {(() => {
            const winnerPost = selectedPosts.find(
              (p) => p.name?.toLowerCase().trim() === result.FinalRecommendation?.WinnerName?.toLowerCase().trim()
            ) || selectedPosts[0];
            return (
              <div className="flex flex-wrap items-center gap-3.5">
                <button type="button" 
                  onClick={() => winnerPost.sellerId ? navigate(`/chat/${encodeURIComponent(winnerPost.sellerId)}`, { state: { fromPath: "/compare" } }) : navigate(`/post/${winnerPost.id}`, { state: { fromPath: "/compare" } })}
                  className="flex items-center justify-center gap-2 rounded-xl border border-input bg-background px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  {t.sendMessage} <MessageCircle className="h-[18px] w-[18px]" strokeWidth={2.2} />
                </button>
                <button type="button" onClick={() => navigate(`/post/${winnerPost.id}`, { state: { fromPath: "/compare" } })}
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  {t.viewPost || "View Post"} <ArrowLeft className={`h-[18px] w-[18px] ${language === "ar" ? "" : "rotate-180"}`} strokeWidth={2.2} />
                </button>
              </div>
            );
          })()}
        </section>
      )}

      {/* ── CTA for all posts ── */}
      <section className="compare-card rounded-2xl border border-border/50 bg-card p-5 shadow-sm sm:p-6">
        <h3 className="mb-4 text-base font-bold text-foreground">{t.viewComparedPosts}</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {selectedPosts.map((post) => (
            <button key={post.id} type="button" onClick={() => navigate(`/post/${post.id}`, { state: { fromPath: "/compare" } })}
              className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/10 p-4 text-left transition-all">
              {post.image ? (
                <img src={post.image} alt={post.name} className="h-14 w-14 rounded-lg border border-border/30 object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted/30">
                  <Scale className="h-5 w-5 text-muted-foreground/40" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground sm:text-base">{post.name}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
                  <span className="font-bold text-foreground">{post.price > 0 ? `${post.price.toLocaleString()} JOD` : "—"}</span>
                  {post.location && (
                      <span className="truncate text-muted-foreground">{post.location}</span>
                  )}
                </div>
                {post.averageRating && post.averageRating > 0 && (
                  <div className="mt-1.5 flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                    <Star className="h-3 w-3 fill-current" />
                    <span>{post.averageRating.toFixed(1)}</span>
                    {post.reviewCount ? (
                      <span className="opacity-70">({post.reviewCount})</span>
                    ) : null}
                  </div>
                )}
              </div>
              <ArrowLeft className="h-4 w-4 rotate-180 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
