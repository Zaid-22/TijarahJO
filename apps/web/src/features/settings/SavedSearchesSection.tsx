import { Bookmark, Search, Trash2, ExternalLink } from "lucide-react";
import { Button } from "../../shared/ui/button";
import { Language } from "../../translations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../shared/ui/card";
import { useSavedSearches } from "../../shared/hooks/useSavedSearches";

interface SavedSearchesSectionProps {
  language: Language;
  onNavigate?: (path: string) => void;
}

const COPY = {
  en: {
    title: "Saved Searches",
    description: "Manage your saved search alerts and quick links.",
    noSavedSearches: "No saved searches yet",
    noSavedSearchesDesc:
      "Save a search from the marketplace to quickly access it later.",
    category: "Category",
    city: "City",
    minPrice: "Min Price",
    maxPrice: "Max Price",
    delete: "Delete saved search",
    search: "View results",
  },
  ar: {
    title: "عمليات البحث المحفوظة",
    description: "إدارة تنبيهات البحث المحفوظة والروابط السريعة.",
    noSavedSearches: "لا توجد عمليات بحث محفوظة",
    noSavedSearchesDesc: "احفظ بحثًا من السوق للوصول إليه بسرعة لاحقًا.",
    category: "الفئة",
    city: "المدينة",
    minPrice: "الحد الأدنى للسعر",
    maxPrice: "الحد الأقصى للسعر",
    delete: "حذف البحث المحفوظ",
    search: "عرض النتائج",
  },
};

export function SavedSearchesSection({
  language,
  onNavigate,
}: SavedSearchesSectionProps) {
  const { savedSearches, removeSavedSearch } = useSavedSearches();
  const copy = COPY[language];

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">{copy.title}</CardTitle>
        </div>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {savedSearches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/30 rounded-lg border border-dashed border-border">
            <Bookmark className="h-8 w-8 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-foreground">
              {copy.noSavedSearches}
            </p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              {copy.noSavedSearchesDesc}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedSearches.map((search) => (
              <div
                key={search.id}
                className="flex items-start justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors group"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="font-medium text-foreground flex items-center gap-2 truncate">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    {search.query || "—"}
                  </h4>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                    {search.category && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-md text-muted-foreground">
                        {copy.category}: {search.category}
                      </span>
                    )}
                    {search.city && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-md text-muted-foreground">
                        {copy.city}: {search.city}
                      </span>
                    )}
                    {search.minPrice !== undefined && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-md text-muted-foreground">
                        {copy.minPrice}: {search.minPrice}
                      </span>
                    )}
                    {search.maxPrice !== undefined && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-md text-muted-foreground">
                        {copy.maxPrice}: {search.maxPrice}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary transition-colors h-8 w-8"
                    title={copy.search}
                    onClick={() => {
                      if (!onNavigate) return;
                      const params = new URLSearchParams();
                      if (search.query) params.set("q", search.query);
                      if (search.category)
                        params.set("category", search.category);
                      if (search.city) params.set("city", search.city);
                      if (search.minPrice)
                        params.set("minPrice", search.minPrice.toString());
                      if (search.maxPrice)
                        params.set("maxPrice", search.maxPrice.toString());
                      onNavigate(`/search?${params.toString()}`);
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors h-8 w-8"
                    title={copy.delete}
                    onClick={() => removeSavedSearch(search.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
