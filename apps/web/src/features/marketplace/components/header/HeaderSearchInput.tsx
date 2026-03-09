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
      inputClassName="h-[2.85rem] rounded-full border-transparent bg-muted/40 shadow-inner hover:bg-muted/60 focus-visible:bg-background focus-visible:border-primary/50 focus-visible:ring-primary/20 focus-visible:shadow-md transition-all duration-300"
      iconClassName="h-[1.15rem] w-[1.15rem] text-muted-foreground group-hover:text-primary transition-colors"
      clearButtonClassName="h-7 w-7 text-muted-foreground hover:bg-muted/50 rounded-full"
    />
  );
}
