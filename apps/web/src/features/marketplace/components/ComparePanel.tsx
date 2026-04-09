import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { X, Scale, ArrowRight, Trash2, Plus } from "lucide-react";
import { useCompare } from "../../../contexts/CompareContext";
import { APP_ROUTE_PATHS } from "../../../app/routes/routeConfig";

export const ComparePanel = React.memo(function ComparePanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedProducts, removeFromCompare, clearCompare, compareCount } =
    useCompare();

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

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 animate-in slide-in-from-bottom duration-300"
      role="complementary"
      aria-label="Product comparison panel"
    >
      <div className="mx-auto max-w-4xl px-3 pb-3 sm:px-4 sm:pb-4">
        <div
          className="relative overflow-hidden rounded-2xl border border-border
            bg-background shadow-[0_20px_50px_rgba(0,0,0,0.15)] 
            sm:px-5 sm:py-4"
        >
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary ring-1 ring-primary shadow-sm">
                <Scale className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  Compare {selectedProducts[0]?.category || "Items"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {compareCount}/3 selected
                  {!canCompare && " — add 1 more"}
                </p>
              </div>
            </div>
            <button
              onClick={clearCompare}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
              aria-label="Clear all selections"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{location.pathname.includes("/ar") ? "مسح" : "Clear"}</span>
            </button>
          </div>

          {/* Product Thumbnails */}
          <div className="flex items-center gap-3">
            <div className="flex flex-1 items-center gap-2 overflow-x-auto pb-1">
              {selectedProducts.map((product) => (
                <div
                  key={product.id}
                  className="group relative flex shrink-0 items-center gap-2.5 rounded-xl bg-accent p-1.5 pr-3 transition-colors"
                >
                  <div className="relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-10 w-10 rounded-lg border border-border bg-card object-cover shadow-sm ring-2 ring-transparent transition-all group-hover:ring-primary/30"
                    />
                    <button
                      onClick={() => removeFromCompare(product.id)}
                      className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-all hover:bg-destructive hover:text-white"
                      title="Remove product"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="hidden min-w-0 flex-1 sm:block">
                    <p className="truncate text-[11px] font-bold text-foreground">
                      {product.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {product.price.toLocaleString()} JOD
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
                  <span className="hidden text-[10px] italic text-muted-foreground/40 sm:block">
                    Empty spot
                  </span>
                </div>
              ))}
            </div>

            {/* Action Button */}
            <div className="flex shrink-0 items-center pl-2 border-l border-border/20">
              <button
                onClick={handleCompare}
                disabled={!canCompare}
                className={`group flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold shadow-lg transition-all active:scale-95 ${
                  canCompare
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-primary/20 hover:shadow-xl"
                    : "cursor-not-allowed bg-muted text-muted-foreground opacity-50 shadow-none"
                }`}
              >
                <span>Compare</span>
                <ArrowRight className={`h-4 w-4 transition-transform ${canCompare ? "group-hover:translate-x-1" : ""}`} />
              </button>
            </div>
          </div>

          {/* Gradient accent */}
          <div className="pointer-events-none absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        </div>
      </div>
    </div>
  );
});
