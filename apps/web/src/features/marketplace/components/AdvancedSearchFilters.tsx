import { useCallback } from "react";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import { useCatalogCategories } from "../../../shared/hooks/useCatalogCategories";
import { useLocationOptions } from "../../../shared/hooks/useLocationOptions";
import { resolveCategoryName } from "../../../shared/lib/categoryVisuals";
import type { Language } from "../../../types";

export interface SearchFilters {
  category?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "date" | "price" | "views";
  sortOrder?: "asc" | "desc";
}

interface AdvancedSearchFiltersProps {
  language: Language;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onApply: () => void;
  onClear: () => void;
  categoryDisabled?: boolean;
  showCategory?: boolean;
  showApplyButton?: boolean;
}

const SORT_OPTIONS_EN = [
  { value: "date-desc", label: "Newest First" },
  { value: "date-asc", label: "Oldest First" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "views-desc", label: "Most Viewed" },
];

const SORT_OPTIONS_AR = [
  { value: "date-desc", label: "الأحدث أولاً" },
  { value: "date-asc", label: "الأقدم أولاً" },
  { value: "price-asc", label: "السعر: من الأقل" },
  { value: "price-desc", label: "السعر: من الأعلى" },
  { value: "views-desc", label: "الأكثر مشاهدة" },
];

export function AdvancedSearchFilters({
  language,
  filters,
  onFiltersChange,
  onApply,
  onClear,
  categoryDisabled = false,
  showCategory = false,
  showApplyButton = true,
}: AdvancedSearchFiltersProps) {
  const { categories } = useCatalogCategories();
  const { cityNames } = useLocationOptions("", language);
  const isRTL = language === "ar";
  const sortOptions = language === "ar" ? SORT_OPTIONS_AR : SORT_OPTIONS_EN;
  const currentSort = `${filters.sortBy || "date"}-${filters.sortOrder || "desc"}`;

  const updateFilter = useCallback(
    (key: keyof SearchFilters, value: unknown) => {
      onFiltersChange({ ...filters, [key]: value || undefined });
    },
    [filters, onFiltersChange],
  );

  const hasActiveFilters =
    filters.category ||
    filters.city ||
    filters.minPrice ||
    filters.maxPrice ||
    (filters.sortBy && filters.sortBy !== "date");

  const labels = {
    title: language === "ar" ? "فلاتر البحث" : "Search Filters",
    category: language === "ar" ? "الفئة" : "Category",
    allCategories: language === "ar" ? "جميع الفئات" : "All Categories",
    city: language === "ar" ? "المدينة" : "City",
    allCities: language === "ar" ? "جميع المدن" : "All Cities",
    priceRange: language === "ar" ? "نطاق السعر" : "Price Range",
    min: language === "ar" ? "الحد الأدنى" : "Min",
    max: language === "ar" ? "الحد الأعلى" : "Max",
    sortBy: language === "ar" ? "ترتيب حسب" : "Sort By",
    apply: language === "ar" ? "تطبيق" : "Apply Filters",
    clear: language === "ar" ? "مسح الكل" : "Clear All",
    currency: language === "ar" ? "د.أ" : "JOD",
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-3">
      {/* Header (Mobile Only) */}
      <div className="flex items-center justify-between pb-4 border-b border-border/40 lg:hidden">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          {labels.title}
        </h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
            {labels.clear}
          </button>
        )}
      </div>

      {showCategory ? (
        <FilterGroup label={labels.category} className="lg:w-48 lg:shrink-0">
          {categoryDisabled ? (
            <div className="w-full rounded-xl bg-muted/40 px-4 py-2 text-sm font-medium text-foreground">
              {filters.category || labels.allCategories}
            </div>
          ) : (
            <div className="relative">
              <select
                name="category"
                aria-label={labels.category}
                value={filters.category || ""}
                onChange={(e) => updateFilter("category", e.target.value)}
                className="w-full appearance-none rounded-xl border-transparent bg-muted/40 px-4 h-10 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20 focus:outline-none"
              >
                <option value="">{labels.allCategories}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {resolveCategoryName(cat, language)}
                  </option>
                ))}
              </select>
              <ChevronDown
                className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none ${isRTL ? "left-3" : "right-3"}`}
              />
            </div>
          )}
        </FilterGroup>
      ) : null}

      {/* City Filter */}
      <FilterGroup label={labels.city} className="lg:w-48 lg:shrink-0">
        <div className="relative">
          <select
            name="city"
            aria-label={labels.city}
            value={filters.city || ""}
            onChange={(e) => updateFilter("city", e.target.value)}
            className="w-full appearance-none rounded-xl border-transparent bg-muted/40 px-4 h-10 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20 focus:outline-none"
          >
            <option value="">{labels.allCities}</option>
            {cityNames.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <ChevronDown
            className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none ${isRTL ? "left-3" : "right-3"}`}
          />
        </div>
      </FilterGroup>

      {/* Price Range Filter */}
      <FilterGroup label={`${labels.priceRange} (${labels.currency})`} className="lg:w-64 lg:shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              type="number"
              name="minPrice"
              aria-label={labels.min}
              placeholder={labels.min}
              value={filters.minPrice ?? ""}
              onChange={(e) =>
                updateFilter(
                  "minPrice",
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
              min={0}
              className="h-10 rounded-xl border-transparent bg-muted/40 px-3 font-medium transition-colors hover:bg-muted/60 focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <span className="text-sm font-medium text-muted-foreground/60">—</span>
          <div className="flex-1">
            <Input
              type="number"
              name="maxPrice"
              aria-label={labels.max}
              placeholder={labels.max}
              value={filters.maxPrice ?? ""}
              onChange={(e) =>
                updateFilter(
                  "maxPrice",
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
              min={0}
              className="h-10 rounded-xl border-transparent bg-muted/40 px-3 font-medium transition-colors hover:bg-muted/60 focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </FilterGroup>

      {/* Sort By */}
      <FilterGroup label={labels.sortBy} className="lg:w-56 lg:shrink-0">
        <div className="relative">
          <select
            name="sortBy"
            aria-label={labels.sortBy}
            value={currentSort}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split("-") as [
                "date" | "price" | "views",
                "asc" | "desc",
              ];
              onFiltersChange({ ...filters, sortBy, sortOrder });
            }}
            className="w-full appearance-none rounded-xl border-transparent bg-muted/40 px-4 h-10 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20 focus:outline-none"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none ${isRTL ? "left-3" : "right-3"}`}
          />
        </div>
      </FilterGroup>

      {hasActiveFilters ? (
        <div className="hidden lg:block lg:ml-auto">
          <Button
            variant="ghost"
            type="button"
            onClick={onClear}
            className="h-10 px-4 font-bold text-muted-foreground hover:bg-muted/40 hover:text-foreground"
          >
            {labels.clear}
          </Button>
        </div>
      ) : null}

      {showApplyButton ? (
        <div className="mt-4 border-t border-border/70 pt-4 lg:hidden w-full">
          <Button
            type="button"
            className="w-full rounded-xl shadow-md"
            size="lg"
            onClick={onApply}
          >
            {labels.apply}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function FilterGroup({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-2.5 lg:space-y-0 ${className || ""}`}>
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 lg:hidden">
        {label}
      </p>
      {children}
    </div>
  );
}
