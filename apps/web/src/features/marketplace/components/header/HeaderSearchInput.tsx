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
      submitLabel={t.searchButtonLabel}
      isRTL={isRTL}
      size="compact"
      className="w-full"
    />
  );
}
