import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { X, Scale, ArrowRight, Trash2 } from "lucide-react";
import { useCompare } from "../../../contexts/CompareContext";
import { APP_ROUTE_PATHS } from "../../../app/routes/routeConfig";

export const ComparePanel = React.memo(function ComparePanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedProducts, removeFromCompare, clearCompare, compareCount } =
    useCompare();

  if (compareCount === 0 || location.pathname === APP_ROUTE_PATHS.compare) return null;

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
          className="relative overflow-hidden rounded-2xl border border-white/20 
            bg-slate-900/85 px-4 py-3 shadow-2xl shadow-black/30 
            backdrop-blur-xl sm:px-5 sm:py-4"
        >
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 shadow-sm backdrop-blur-sm">
                <Scale className="h-4.5 w-4.5 text-white/90" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Compare {selectedProducts[0]?.category || "Products"}
                </p>
                <p className="text-xs text-slate-400">
                  {compareCount}/3 selected
                  {!canCompare && " — add at least 2"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearCompare}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Clear all products from comparison"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>

          {/* Product Thumbnails */}
          <div className="flex items-center gap-3">
            <div className="flex flex-1 items-center gap-2 overflow-x-auto pb-1">
              {selectedProducts.map((product) => (
                <div
                  key={product.id}
                  className="group relative flex shrink-0 items-center gap-2.5 rounded-xl bg-white/10 px-3 py-2 transition-colors hover:bg-white/15"
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-10 w-10 rounded-lg object-cover ring-1 ring-white/10"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/10">
                      <Scale className="h-4 w-4 text-slate-400" />
                    </div>
                  )}
                  <div className="min-w-0 max-w-[120px]">
                    <p className="truncate text-xs font-medium text-white">
                      {product.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {product.category} • {product.price > 0
                        ? `${product.price.toLocaleString()} JOD`
                        : "N/A"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCompare(product.id)}
                    className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
                    aria-label={`Remove ${product.name} from comparison`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {/* Empty slots */}
              {Array.from({ length: 3 - compareCount }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-white/10"
                >
                  <span className="text-xs text-slate-600">+</span>
                </div>
              ))}
            </div>

            {/* Compare Button */}
            <button
              type="button"
              onClick={handleCompare}
              disabled={!canCompare}
              className={
                "flex shrink-0 items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 " +
                (canCompare
                  ? "bg-primary text-white shadow-lg shadow-primary/30 hover:brightness-110 active:scale-95"
                  : "cursor-not-allowed bg-white/5 text-slate-500")
              }
            >
              Compare
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Gradient accent */}
          <div className="pointer-events-none absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        </div>
      </div>
    </div>
  );
});
