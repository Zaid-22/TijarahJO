import { useNavigate } from "react-router-dom";
import {
  Scale,
  ArrowLeft,
  Sparkles,
  Layers,
  Trophy,
  Zap,
  Home,
  PlusCircle,
  MinusCircle,
  ListChecks,
  DollarSign,
  FileText,
  MessageCircle,
} from "lucide-react";
import type {
  CompareResponse,
  PostProsConsDTO,
  PostFeaturesDTO,
  PostSummaryDTO,
} from "../../../services/api/compare";
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
  const t =
    marketplaceTranslations[language as keyof typeof marketplaceTranslations] ||
    marketplaceTranslations.en;

  return (
    <div className="space-y-5">
      {/* ── AI Analysis Divider ── */}
      <div className="compare-ai-divider flex items-center gap-3 py-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-0.5">
          <h2 className="text-lg font-bold text-foreground">
            {t.aiAnalysisResults}
          </h2>
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
            <h2 className="text-lg font-bold text-foreground">
              {t.postOverview}
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {result.PostSummaries.map((ps: PostSummaryDTO, idx: number) => {
              const winnerPost =
                selectedPosts.find(
                  (p: ComparePost) =>
                    p.name?.toLowerCase().trim() ===
                    ps.PostName?.toLowerCase().trim(),
                ) || selectedPosts[0];
              return (
                <div
                  key={idx}
                  className="compare-summary-card relative overflow-hidden rounded-xl border border-border/40 bg-muted/5 p-5 sm:p-6"
                >
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
          <h2 className="text-lg font-bold text-foreground">
            {t.featureDifferences}
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(result.FeatureDifferences || []).map(
            (fd: PostFeaturesDTO, pIdx: number) => (
              <div
                key={pIdx}
                className="rounded-xl border border-border/40 bg-muted/5 p-5 sm:p-6"
              >
                <h3 className="mb-4 text-base font-bold text-foreground">
                  {fd.PostName}
                </h3>
                <ul className="space-y-3.5">
                  {fd.Features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm sm:text-base"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="leading-7 text-foreground/80">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ),
          )}
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.ProsCons.map((pc: PostProsConsDTO) => (
            <div
              key={pc.PostName}
              className="flex flex-col rounded-2xl border border-border/40 bg-card p-5 shadow-sm sm:p-6"
            >
              <h3 className="mb-2 text-lg font-bold text-foreground">
                {pc.PostName}
              </h3>
              <div className="mb-6 flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-2.5 py-1 font-semibold text-teal-700 dark:text-teal-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-500"></span>
                  {pc.Pros.length} {t.prosLabel?.toLowerCase() || "pros"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 font-semibold text-rose-700 dark:text-rose-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                  {pc.Cons.length} {t.consLabel?.toLowerCase() || "cons"}
                </span>
              </div>

              <div className="flex-1 space-y-6">
                {pc.Pros.length > 0 && (
                  <div>
                    <div className="mb-3 text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                      {t.prosLabel}
                    </div>
                    <ul className="space-y-3">
                      {pc.Pros.map((pro, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-sm sm:text-base"
                        >
                          <PlusCircle className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
                          <span className="leading-relaxed text-foreground/80">
                            {pro}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {pc.Cons.length > 0 && (
                  <div>
                    <div className="mb-3 text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                      {t.consLabel}
                    </div>
                    <ul className="space-y-3">
                      {pc.Cons.map((con, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-sm sm:text-base"
                        >
                          <MinusCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400" />
                          <span className="leading-relaxed text-foreground/80">
                            {con}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
            <h2 className="text-lg font-bold text-foreground">
              {t.bestForSection || t.bestForLabel}
            </h2>
          </div>
          <div className="mb-5 flex flex-wrap gap-2.5 sm:gap-3">
            {[
              {
                key: "Budget" as const,
                icon: DollarSign,
                label: t.budgetPick || "Budget",
              },
              {
                key: "Performance" as const,
                icon: Zap,
                label: t.performancePick || "Performance",
              },
              {
                key: "DailyUse" as const,
                icon: Home,
                label: t.dailyUsePick || "Daily Use",
              },
            ].map(({ key, icon: Icon, label }) => (
              <button
                type="button"
                key={key}
                onClick={() => setActiveBestFor(key)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all ${
                  activeBestFor === key
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50 bg-background text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label || key}
              </button>
            ))}
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-muted/10 p-5 sm:p-6 shadow-sm transition-all duration-300">
            <p className="text-sm font-medium leading-relaxed text-foreground/80 sm:text-base sm:leading-loose">
              {activeBestFor === "Budget" && result.BestFor.Budget}
              {activeBestFor === "Performance" && result.BestFor.Performance}
              {activeBestFor === "DailyUse" && result.BestFor.DailyUse}
            </p>
          </div>
        </section>
      )}

      {/* ── Final Recommendation — Winner Card ── */}
      {result.FinalRecommendation && (
        <section className="compare-card compare-recommendation overflow-hidden rounded-2xl border border-amber-500/20 bg-linear-to-br from-amber-500/10 via-card to-card p-5 shadow-lg sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 ring-4 ring-amber-500/10 shadow-sm">
              <Trophy className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                  {t.winnerAnnouncement}
                </h2>
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                {t.aiGeneratedPick}
              </p>
            </div>
          </div>
          <div className="mb-6 flex items-center gap-4">
            <span className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {result.FinalRecommendation.WinnerName}
            </span>
          </div>
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-amber-500/10 bg-amber-500/5 p-4 sm:col-span-1 sm:p-5">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">
                {t.bestForLabel}
              </span>
              <p className="text-sm font-medium leading-relaxed text-foreground sm:text-base">
                {result.FinalRecommendation.BestFor}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-500/10 bg-amber-500/5 p-4 sm:col-span-2 sm:p-5">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">
                {t.whyLabel || "The Verdict"}
              </span>
              <p className="text-sm italic leading-relaxed text-foreground/80 sm:text-base">
                "{result.FinalRecommendation.Reason}"
              </p>
            </div>
          </div>
          {(() => {
            const winnerPost =
              selectedPosts.find(
                (p) =>
                  p.name?.toLowerCase().trim() ===
                  result.FinalRecommendation?.WinnerName?.toLowerCase().trim(),
              ) || selectedPosts[0];
            return (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() =>
                    winnerPost.sellerId
                      ? navigate(
                          `/chat/${encodeURIComponent(winnerPost.sellerId)}`,
                          { state: { fromPath: "/compare" } },
                        )
                      : navigate(`/post/${winnerPost.id}`, {
                          state: { fromPath: "/compare" },
                        })
                  }
                  className="flex items-center justify-center gap-2 rounded-xl border border-input bg-background px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {t.sendMessage}{" "}
                  <MessageCircle
                    className="h-[18px] w-[18px]"
                    strokeWidth={2.2}
                  />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/post/${winnerPost.id}`, {
                      state: { fromPath: "/compare" },
                    })
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {t.viewPost || "View Post"}{" "}
                  <ArrowLeft
                    className={`h-[18px] w-[18px] ${language === "ar" ? "" : "rotate-180"}`}
                    strokeWidth={2.2}
                  />
                </button>
              </div>
            );
          })()}
        </section>
      )}
    </div>
  );
}
