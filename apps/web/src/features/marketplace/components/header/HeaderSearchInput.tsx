import { type Language, translations } from "../../../../translations";
import { MarketplaceSearchField } from "../MarketplaceSearchField";

interface HeaderSearchInputProps {
  language: Language;
  isRTL: boolean;
  searchQuery: string;
  onSearchChange?: (query: string) => void;
  onSearchSubmit?: () => void;
}

export function HeaderSearchInput({
  language,
  isRTL,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
}: HeaderSearchInputProps) {
  const t = translations[language];

  return (
    <MarketplaceSearchField
      value={searchQuery}
      placeholder={t.searchPlaceholder}
      clearLabel={language === "ar" ? "مسح البحث" : "Clear search"}
      onChange={(value) => onSearchChange?.(value)}
      onSubmit={onSearchSubmit}
      isRTL={isRTL}
      size="compact"
      className="w-full"
      inputClassName="h-11 border-border/55 bg-background/90 shadow-sm focus-visible:border-primary/45 focus-visible:ring-primary/15 focus-visible:shadow-md"
      iconClassName="h-4 w-4"
      clearButtonClassName="h-7 w-7"
    />
  );
}
