import { useCallback } from "react";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import { Label } from "../../../shared/ui/label";
import { useCatalogCategories } from "../../../shared/hooks/useCatalogCategories";
import { resolveCategoryName } from "../../../shared/lib/categoryVisuals";
import type { Language } from "../../../types";

export interface SearchFilters {
  category?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  sortBy?: "date" | "price" | "views";
  sortOrder?: "asc" | "desc";
}

interface AdvancedSearchFiltersProps {
  language: Language;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onApply: () => void;
  onClear: () => void;
}

const JORDAN_CITIES = [
  "Amman",
  "Irbid",
  "Zarqa",
  "Aqaba",
  "Madaba",
  "Jerash",
  "Ajloun",
  "Karak",
  "Mafraq",
  "Tafilah",
  "Ma'an",
  "Balqa",
];

const JORDAN_CITIES_AR: Record<string, string> = {
  Amman: "عمّان",
  Irbid: "إربد",
  Zarqa: "الزرقاء",
  Aqaba: "العقبة",
  Madaba: "مادبا",
  Jerash: "جرش",
  Ajloun: "عجلون",
  Karak: "الكرك",
  Mafraq: "المفرق",
  Tafilah: "الطفيلة",
  "Ma'an": "معان",
  Balqa: "البلقاء",
};

const CONDITIONS_EN = ["New", "Used - Like New", "Used - Good", "Used - Fair"];
const CONDITIONS_AR = [
  "جديد",
  "مستعمل - كالجديد",
  "مستعمل - جيد",
  "مستعمل - مقبول",
];

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
}: AdvancedSearchFiltersProps) {
  const { categories } = useCatalogCategories();
  const isRTL = language === "ar";
  const conditions = language === "ar" ? CONDITIONS_AR : CONDITIONS_EN;
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
    filters.condition ||
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
    condition: language === "ar" ? "الحالة" : "Condition",
    allConditions: language === "ar" ? "جميع الحالات" : "All Conditions",
    sortBy: language === "ar" ? "ترتيب حسب" : "Sort By",
    apply: language === "ar" ? "تطبيق" : "Apply Filters",
    clear: language === "ar" ? "مسح الكل" : "Clear All",
    currency: language === "ar" ? "د.أ" : "JOD",
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          {labels.title}
        </h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            {labels.clear}
          </button>
        )}
      </div>

      {/* Category Filter */}
      <FilterGroup label={labels.category}>
        <div className="relative">
          <select
            value={filters.category || ""}
            onChange={(e) => updateFilter("category", e.target.value)}
            className="w-full appearance-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-colors"
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
      </FilterGroup>

      {/* City Filter */}
      <FilterGroup label={labels.city}>
        <div className="relative">
          <select
            value={filters.city || ""}
            onChange={(e) => updateFilter("city", e.target.value)}
            className="w-full appearance-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-colors"
          >
            <option value="">{labels.allCities}</option>
            {JORDAN_CITIES.map((city) => (
              <option key={city} value={city}>
                {language === "ar" ? JORDAN_CITIES_AR[city] || city : city}
              </option>
            ))}
          </select>
          <ChevronDown
            className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none ${isRTL ? "left-3" : "right-3"}`}
          />
        </div>
      </FilterGroup>

      {/* Price Range Filter */}
      <FilterGroup label={`${labels.priceRange} (${labels.currency})`}>
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              type="number"
              placeholder={labels.min}
              value={filters.minPrice ?? ""}
              onChange={(e) =>
                updateFilter(
                  "minPrice",
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
              min={0}
              className="rounded-xl"
            />
          </div>
          <span className="self-center text-muted-foreground text-sm">—</span>
          <div className="flex-1">
            <Input
              type="number"
              placeholder={labels.max}
              value={filters.maxPrice ?? ""}
              onChange={(e) =>
                updateFilter(
                  "maxPrice",
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
              min={0}
              className="rounded-xl"
            />
          </div>
        </div>
      </FilterGroup>

      {/* Condition Filter */}
      <FilterGroup label={labels.condition}>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => updateFilter("condition", undefined)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-all ${
              !filters.condition
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:border-primary/30"
            }`}
          >
            {labels.allConditions}
          </button>
          {conditions.map((cond) => (
            <button
              key={cond}
              type="button"
              onClick={() => updateFilter("condition", cond)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-all ${
                filters.condition === cond
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:border-primary/30"
              }`}
            >
              {cond}
            </button>
          ))}
        </div>
      </FilterGroup>

      {/* Sort By */}
      <FilterGroup label={labels.sortBy}>
        <div className="relative">
          <select
            value={currentSort}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split("-") as [
                "date" | "price" | "views",
                "asc" | "desc",
              ];
              onFiltersChange({ ...filters, sortBy, sortOrder });
            }}
            className="w-full appearance-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-colors"
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

      {/* Apply Button */}
      <Button
        className="w-full rounded-xl shadow-md"
        size="lg"
        onClick={onApply}
      >
        {labels.apply}
      </Button>
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
