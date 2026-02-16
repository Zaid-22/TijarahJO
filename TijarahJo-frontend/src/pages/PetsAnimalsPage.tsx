import { CategoryPage } from "./CategoryPage";
import { Language } from "../translations";
import { Product } from "../types";

interface PetsAnimalsPageProps {
  onBack: () => void;
  products: Product[];
  onProductClick: (productId: string) => void;
  favoriteIds: string[];
  onFavoriteToggle: (productId: string) => void;
  language: Language;
  onShowFavorites?: () => void;
  onShowSellItem?: () => void;
  onShowProfile?: () => void;
  onShowSettings?: () => void;
  onLogout?: () => void;
  onToggleLanguage?: () => void;
  onCategoryClick?: (categoryName: string) => void;
  isAuthenticated?: boolean;
  currentUserName?: string;
  userAvatar?: string;
  userFirstName?: string;
  userLastName?: string;
}

export function PetsAnimalsPage(props: PetsAnimalsPageProps) {
  return <CategoryPage {...props} categoryName="Pets & Animals" />;
}