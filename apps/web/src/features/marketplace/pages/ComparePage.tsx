import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Scale, ArrowLeft, Sparkles, DollarSign, Layers,
  ThumbsUp, ThumbsDown, Trophy, Zap, Home,
  AlertTriangle, RefreshCw,
} from "lucide-react";
import { useCompare } from "../../../contexts/CompareContext";
import { api } from "../../../services/api";
import type { CompareResponse, ProductProsConsDTO, ProductFeaturesDTO } from "../../../services/api/compare";
import "./compare.css";

type BestForCategory = "Budget" | "Performance" | "DailyUse";

export default function ComparePage() {
  const navigate = useNavigate();
  const { selectedProducts, clearCompare } = useCompare();
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeBestFor, setActiveBestFor] = useState<BestForCategory>("Budget");

  const productIds = selectedProducts.map((p) => Number(p.id));

  const fetchComparison = async () => {
    if (productIds.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.compare.compareProducts(productIds);
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to compare products"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productIds.length >= 2) {
      fetchComparison();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (selectedProducts.length < 2) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60">
          <Scale className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground">
          No Products to Compare
        </h1>
        <p className="max-w-md text-center text-sm text-muted-foreground">
          Select 2–3 products from the marketplace to compare them side by side
          with AI-powered analysis.
        </p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-2 flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110"
        >
          <ArrowLeft className="h-4 w-4" />
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground transition-colors hover:bg-muted"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-foreground sm:text-xl">
                Product Comparison
              </h1>
              <p className="text-xs text-muted-foreground">
                AI-powered analysis of {selectedProducts.length} products
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              clearCompare();
              navigate("/");
            }}
            className="rounded-xl bg-muted/60 px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            New Comparison
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        {/* Product Overview Grid */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:gap-5">
          {selectedProducts.map((product) => (
            <div
              key={product.id}
              className="compare-card overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm"
            >
              {product.image ? (
                <div className="aspect-[4/3] overflow-hidden bg-muted/30">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-muted/30">
                  <Scale className="h-10 w-10 text-muted-foreground/40" />
                </div>
              )}
              <div className="p-3 sm:p-4">
                <h3 className="truncate text-sm font-semibold text-foreground sm:text-base">
                  {product.name}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {product.category}
                </p>
                <p className="mt-2 text-base font-bold text-slate-950 dark:text-white sm:text-lg">
                  {product.price > 0
                    ? `${product.price.toLocaleString()} JOD`
                    : "Price not listed"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <div className="flex justify-center">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-4 ring-primary/5">
                <Sparkles className="h-8 w-8 animate-pulse text-primary drop-shadow-sm" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                AI is analyzing your products...
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Comparing features, prices, and value
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">{error}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Please try again
              </p>
            </div>
            <button
              type="button"
              onClick={fetchComparison}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        )}

        {/* AI Results */}
        {result && !loading && (
          <div className="space-y-5">
            {/* Price Comparison */}
            <section className="compare-card rounded-2xl border border-border/50 bg-card p-4 shadow-sm sm:p-5">
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
                  <DollarSign className="h-5 w-5 text-blue-500" />
                </div>
                <h2 className="text-base font-bold text-foreground">
                  Price Comparison
                </h2>
              </div>
              
              {/* Visual Price Comparison */}
              <div className="mb-4">
                {(() => {
                  if (selectedProducts.length === 0) return null;
                  const sorted = [...selectedProducts].sort(
                    (a, b) => (a.price || 0) - (b.price || 0)
                  );
                  const cheapest = sorted[0];

                  return (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {selectedProducts.map((product) => {
                        const price = product.price || 0;
                        const isCheapest = price === cheapest.price;
                        let contextBadge = null;

                        if (!isCheapest && cheapest.price > 0) {
                          const ratio = (price / cheapest.price).toFixed(1);
                          contextBadge = (
                            <span className="inline-flex items-center rounded-md bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-500">
                              {ratio}× more expensive
                            </span>
                          );
                        } else if (
                          isCheapest &&
                          sorted.length > 1 &&
                          sorted[sorted.length - 1].price > 0 &&
                          sorted[sorted.length - 1].price !== price
                        ) {
                          const diff = sorted[sorted.length - 1].price - price;
                          contextBadge = (
                            <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-1 text-[10px] font-bold text-blue-500">
                              Save {diff.toLocaleString()} JOD
                            </span>
                          );
                        }

                        return (
                          <div
                            key={product.id}
                            className={`relative flex flex-col justify-between overflow-hidden rounded-xl border p-4 ${
                              isCheapest
                                ? "border-blue-500/30 bg-blue-500/5"
                                : "border-border/40 bg-muted/20"
                            }`}
                          >
                            <div className="mb-4">
                              <p className="line-clamp-2 text-sm font-semibold text-foreground">
                                {product.name}
                              </p>
                              {contextBadge && (
                                <div className="mt-2.5">{contextBadge}</div>
                              )}
                            </div>
                            <p className="text-2xl font-bold tracking-tight text-foreground">
                              {price.toLocaleString()}{" "}
                              <span className="text-sm font-medium text-muted-foreground">
                                JOD
                              </span>
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
              <div className="relative mt-4 rounded-xl border-l-4 border-blue-500 bg-blue-500/5 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                {result.PriceComparison}
              </div>
            </section>

            {/* Feature Comparison */}
            <section className="compare-card rounded-2xl border border-border/50 bg-card p-4 shadow-sm sm:p-5">
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
                  <Layers className="h-5 w-5 text-blue-500" />
                </div>
                <h2 className="text-base font-bold text-foreground">
                  Feature Differences
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(result.FeatureDifferences || []).map(
                  (fd: ProductFeaturesDTO, pIdx: number) => (
                    <div
                      key={pIdx}
                      className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-4"
                    >
                      <h3 className="mb-3 text-sm font-bold text-blue-700 dark:text-blue-400">
                        {fd.ProductName}
                      </h3>
                      <ul className="space-y-2.5">
                        {fd.Features.map((feature, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2.5 text-xs text-muted-foreground"
                          >
                            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-[10px] font-bold text-blue-600 dark:bg-blue-500/30 dark:text-blue-300">
                              {i + 1}
                            </span>
                            <span className="leading-relaxed text-foreground/80">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                )}
              </div>
            </section>

            {/* Pros & Cons */}
            <section className="compare-card rounded-2xl border border-border/50 bg-card p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
                  <ThumbsUp className="h-5 w-5 text-amber-500" />
                </div>
                <h2 className="text-base font-bold text-foreground">
                  Pros & Cons
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {result.ProsCons.map((pc: ProductProsConsDTO) => (
                  <div
                    key={pc.ProductName}
                    className="rounded-xl border border-border/30 bg-muted/20 p-3.5"
                  >
                    <h3 className="mb-3 text-sm font-bold text-foreground">
                      {pc.ProductName}
                    </h3>
                    {/* Pros */}
                    <div className="mb-3 space-y-1.5">
                      {pc.Pros.map((pro, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-xs"
                        >
                          <ThumbsUp className="mt-1 h-3 w-3 shrink-0 text-blue-500" />
                          <span className="text-foreground/80">{pro}</span>
                        </div>
                      ))}
                    </div>
                    {/* Cons */}
                    <div className="space-y-1.5">
                      {pc.Cons.map((con, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-xs"
                        >
                          <ThumbsDown className="mt-1 h-3 w-3 shrink-0 text-red-500" />
                          <span className="text-foreground/80">{con}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Best For */}
            {result.BestFor && (
              <section className="compare-card rounded-2xl border border-border/50 bg-card p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10">
                      <Trophy className="h-5 w-5 text-purple-500" />
                    </div>
                    <h2 className="text-base font-bold text-foreground">
                      Best Choice For
                    </h2>
                  </div>
                </div>

                {/* Tab Selector */}
                <div className="mb-5 flex flex-wrap gap-2 sm:gap-3">
                  <button
                    onClick={() => setActiveBestFor("Budget")}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-all sm:text-sm ${
                      activeBestFor === "Budget"
                        ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                        : "border-border/50 bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <DollarSign className="h-4 w-4" />
                    Budget
                  </button>
                  <button
                    onClick={() => setActiveBestFor("Performance")}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-all sm:text-sm ${
                      activeBestFor === "Performance"
                        ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                        : "border-border/50 bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Zap className="h-4 w-4" />
                    Performance
                  </button>
                  <button
                    onClick={() => setActiveBestFor("DailyUse")}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-all sm:text-sm ${
                      activeBestFor === "DailyUse"
                        ? "border-violet-500 bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400"
                        : "border-border/50 bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Home className="h-4 w-4" />
                    Daily Use
                  </button>
                </div>

                {/* Dynamic Winner Card */}
                <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-muted/10 p-5">
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {activeBestFor === "Budget" && result.BestFor.Budget}
                      {activeBestFor === "Performance" && result.BestFor.Performance}
                      {activeBestFor === "DailyUse" && result.BestFor.DailyUse}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Final Recommendation */}
            <section className="compare-card compare-recommendation rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-card to-primary/5 p-5 shadow-sm sm:p-6">
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15"><Sparkles className="h-5 w-5 text-primary" /></div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Final Recommendation</h2>
                  <p className="text-[10px] text-muted-foreground">AI-generated suggestion</p>
                </div>
              </div>
              <p className="text-sm font-medium leading-relaxed text-foreground/90">
                {result.FinalRecommendation}
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
