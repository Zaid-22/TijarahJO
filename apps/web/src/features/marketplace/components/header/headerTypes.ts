import { type Language } from "../../../../translations";

export interface HeaderActionHandlers {
  onShowMessages?: () => void;
  onShowProfile?: () => void;
  onShowSettings?: () => void;
  onShowAdminDashboard?: () => void;
  onLogout?: () => void;
  onCategoryClick?: (categoryName: string) => void;
}

export interface HeaderIdentity {
  language: Language;
  isAuthenticated: boolean;
  authLoading?: boolean;
  isAdmin: boolean;
  currentUserDisplayName?: string;
  userAvatar?: string;
  unreadMessagesCount: number;
}
