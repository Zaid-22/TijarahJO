import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { useAppSettings } from "./AppSettingsContext";
import { marketplaceTranslations } from "../features/marketplace/translations";

const MAX_COMPARE_ITEMS = 3;
const BASE_STORAGE_KEY = "tijarahjo_compare_items";

function getStorageKey(userId?: string | null) {
  return userId ? `${BASE_STORAGE_KEY}_${userId}` : `${BASE_STORAGE_KEY}_guest`;
}

export interface ComparePost {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  categoryId?: string;
  location?: string;
  views?: number;
  averageRating?: number;
  reviewCount?: number;
  sellerId?: string;
  sellerName?: string;
  sellerAvatar?: string | null;
}

interface CompareContextValue {
  selectedPosts: ComparePost[];
  addToCompare: (post: ComparePost) => void;
  removeFromCompare: (postId: string) => void;
  clearCompare: () => void;
  isInCompare: (postId: string) => boolean;
  canAddMore: boolean;
  compareCount: number;
}

const CompareContext = createContext<CompareContextValue | null>(null);

function loadFromStorage(userId?: string | null): ComparePost[] {
  try {
    const key = getStorageKey(userId);
    const stored = sessionStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore storage errors
  }
  return [];
}

function saveToStorage(posts: ComparePost[], userId?: string | null) {
  try {
    const key = getStorageKey(userId);
    sessionStorage.setItem(key, JSON.stringify(posts));
  } catch {
    // Ignore storage errors
  }
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { language } = useAppSettings();
  const t = marketplaceTranslations[language as keyof typeof marketplaceTranslations] || marketplaceTranslations.en;
  const [selectedPosts, setSelectedPosts] = useState<ComparePost[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Sync state with storage whenever the user identity stabilizes/changes
  useEffect(() => {
    if (authLoading) return;

    const items = loadFromStorage(user?.id);
    setSelectedPosts(items);
    setInitialized(true);
  }, [user?.id, authLoading]);

  // Persist current state to storage
  useEffect(() => {
    if (!initialized) return;
    saveToStorage(selectedPosts, user?.id);
  }, [selectedPosts, user?.id, initialized]);

  const addToCompare = useCallback(
    (post: ComparePost) => {
      setSelectedPosts((prev) => {
        if (prev.some((p) => p.id === post.id)) {
          queueMicrotask(() => toast.info(t.postAlreadyInCompare));
          return prev;
        }
        if (prev.length >= MAX_COMPARE_ITEMS) {
          queueMicrotask(() => toast.warning(t.compareMaxLimit));
          return prev;
        }
        if (prev.length > 0 && prev[0].category !== post.category) {
          queueMicrotask(() =>
            toast.error(t.compareCategoryMismatch, {
              id: "compare-category-mismatch",
            }),
          );
          return prev;
        }
        queueMicrotask(() =>
          toast.success(t.compareItemAdded.replace("{name}", post.name), {
            id: `compare-added-${post.id}`,
          }),
        );
        return [...prev, post];
      });
    },
    [t.compareCategoryMismatch, t.compareItemAdded, t.compareMaxLimit, t.postAlreadyInCompare],
  );

  const removeFromCompare = useCallback(
    (postId: string) => {
      setSelectedPosts((prev) => {
        const post = prev.find((p) => p.id === postId);
        if (!post) return prev;
        queueMicrotask(() =>
          toast.error(t.compareItemRemoved.replace("{name}", post.name), {
            id: `compare-removed-${postId}`,
          }),
        );
        return prev.filter((p) => p.id !== postId);
      });
    },
    [t.compareItemRemoved],
  );

  const clearCompare = useCallback(() => {
    setSelectedPosts([]);
    toast.info(t.compareCleared);
  }, [t.compareCleared]);

  const isInCompare = useCallback(
    (postId: string) => selectedPosts.some((p) => p.id === postId),
    [selectedPosts],
  );

  const value = useMemo<CompareContextValue>(
    () => ({
      selectedPosts,
      addToCompare,
      removeFromCompare,
      clearCompare,
      isInCompare,
      canAddMore: selectedPosts.length < MAX_COMPARE_ITEMS,
      compareCount: selectedPosts.length,
    }),
    [selectedPosts, addToCompare, removeFromCompare, clearCompare, isInCompare],
  );

  return (
    <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
  );
}

export function useCompare(): CompareContextValue {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
}
