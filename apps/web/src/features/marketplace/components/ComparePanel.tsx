import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { X, Scale, ArrowRight, Trash2, Plus, ArrowLeft } from "lucide-react";
import { useCompare } from "../../../contexts/CompareContext";
import { APP_ROUTE_PATHS } from "../../../app/routes/routeConfig";
import { useAppSettings } from "../../../contexts/AppSettingsContext";
import { marketplaceTranslations } from "../translations";
import type { Language } from "../../../types";
import { useCatalogCategories } from "../../../shared/hooks/useCatalogCategories";
import { resolveCategoryName } from "../../../shared/lib/categoryVisuals";

export const ComparePanel = React.memo(function ComparePanel() {
  const navigate = useNavigate();
  const location = useLocation();
    const { selectedPosts, removeFromCompare, clearCompare, compareCount } =
    useCompare();
  const { language } = useAppSettings();
  const { categories } = useCatalogCategories();
  const t = marketplaceTranslations[language];
  const isRtl = language === "ar";

  const isComparisonHiddenRoute = 
    location.pathname === APP_ROUTE_PATHS.compare || 
    location.pathname === APP_ROUTE_PATHS.login || 
    location.pathname === APP_ROUTE_PATHS.completeProfile ||
    location.pathname === APP_ROUTE_PATHS.forgotPassword ||
    location.pathname === APP_ROUTE_PATHS.favorites;

  if (compareCount === 0 || isComparisonHiddenRoute) return null;

  const canCompare = compareCount >= 2;

  const handleCompare = () => {
    if (canCompare) {
      navigate(APP_ROUTE_PATHS.compare);
    }
  };

  const getLocalizedCategory = () => {
    if (!selectedPosts[0]) return t.compareItems;
    
    const firstPost = selectedPosts[0];
    if (firstPost.categoryId) {
      const category = categories.find(c => String(c.id) === firstPost.categoryId);
      if (category) {
        return resolveCategoryName(category, language as Language);
      }
    }
    
    return firstPost.category;
  };

  const localizedCategory = getLocalizedCategory();

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 animate-in slide-in-from-bottom duration-300 pb-4"
      role="complementary"
      aria-label={t.compareItems}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-4xl px-3 pb-3 sm:px-4 sm:pb-4">
        <div
          className="relative overflow-hidden rounded-2xl border border-border
            bg-background shadow-2xl 
            px-3 py-3 sm:px-5 sm:py-4"
        >
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary ring-1 ring-primary shadow-sm">
                <Scale className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {selectedPosts[0] 
                    ? t.compareCategory.replace("{category}", localizedCategory)
                    : t.compareItems}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.selectedCount.replace("{count}", compareCount.toString())}
                  {!canCompare && t.addMoreToCompare}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearCompare}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
              aria-label={t.clearAll}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{t.clearAll}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-1 items-center gap-2 overflow-x-auto pb-1">
              {selectedPosts.map((post) => (
                <div
                  key={post.id}
                  className="group relative flex shrink-0 items-center gap-2.5 rounded-xl bg-accent p-1.5 pe-3 transition-colors"
                >
                  <div className="relative shrink-0">
                    <img
                      src={post.image}
                      alt={post.name}
                      className="h-10 w-10 rounded-lg border border-border bg-card object-cover shadow-sm ring-2 ring-transparent transition-all group-hover:ring-primary/30"
                    />
                    <button
                      type="button"
                      onClick={() => removeFromCompare(post.id)}
                      className="absolute -top-1.5 inset-inline-end-[-6px] flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-all hover:bg-destructive hover:text-white"
                      title={t.removeProduct}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="hidden min-w-[120px] max-w-[200px] flex-1 sm:block">
                    <p className="truncate text-xs font-bold text-foreground">
                      {post.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {post.price.toLocaleString()} JOD
                    </p>
                  </div>
                </div>
              ))}
              {[...Array(3 - compareCount)].map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 sm:w-auto sm:px-3 sm:justify-start sm:gap-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-border/40 text-muted-foreground/40">
                    <Plus className="h-4 w-4" />
                  </div>
                  <span className="hidden text-xs italic text-muted-foreground/40 sm:block">
                    {t.emptyComparisonSpot}
                  </span>
                </div>
              ))}
            </div>

            {/* Action Button */}
            <div className="flex shrink-0 items-center ps-2 border-s border-border/20">
              <button
                type="button"
                onClick={handleCompare}
                disabled={!canCompare}
                aria-label={t.compareItems}
                className={`group flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold shadow-lg transition-all active:scale-95 ${
                  canCompare
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-primary/20 hover:shadow-xl"
                    : "cursor-not-allowed bg-muted text-muted-foreground opacity-50 shadow-none"
                }`}
              >
                <span>{t.compareItems.split(' ')[0]}</span>
                {isRtl ? (
                   <ArrowLeft className={`h-4 w-4 transition-transform ${canCompare ? "group-hover:-translate-x-1" : ""}`} />
                ) : (
                   <ArrowRight className={`h-4 w-4 transition-transform ${canCompare ? "group-hover:translate-x-1" : ""}`} />
                )}
              </button>
            </div>
          </div>

          {/* Gradient accent */}
          <div className="pointer-events-none absolute -top-px left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent" />
        </div>
      </div>
    </div>
  );
});
