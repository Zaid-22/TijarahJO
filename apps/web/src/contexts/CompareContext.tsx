import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { toast } from "sonner";

const MAX_COMPARE_ITEMS = 3;
const STORAGE_KEY = "tijarahjo_compare_items";

export interface CompareProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface CompareContextValue {
  selectedProducts: CompareProduct[];
  addToCompare: (product: CompareProduct) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
  canAddMore: boolean;
  compareCount: number;
}

const CompareContext = createContext<CompareContextValue | null>(null);

function loadFromStorage(): CompareProduct[] {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore storage errors
  }
  return [];
}

function saveToStorage(products: CompareProduct[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch {
    // Ignore storage errors
  }
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [selectedProducts, setSelectedProducts] = useState<CompareProduct[]>(
    () => loadFromStorage()
  );

  useEffect(() => {
    saveToStorage(selectedProducts);
  }, [selectedProducts]);

  const addToCompare = useCallback(
    (product: CompareProduct) => {
      // Use the current state value directly to avoid side-effects in the updater function
      if (selectedProducts.some((p) => p.id === product.id)) {
        toast.info("Product already in comparison");
        return;
      }
      if (selectedProducts.length >= MAX_COMPARE_ITEMS) {
        toast.warning("You can compare up to 3 products at a time");
        return;
      }
      
      if (
        selectedProducts.length > 0 &&
        selectedProducts[0].category !== product.category
      ) {
        toast.error(`You can only compare items from the "${selectedProducts[0].category}" category`, {
          id: "compare-category-mismatch"
        });
        return;
      }
      
      toast.success(`Added "${product.name}" to comparison`, {
        id: `compare-added-${product.id}`
      });
      setSelectedProducts((prev) => [...prev, product]);
    },
    [selectedProducts]
  );

  const removeFromCompare = useCallback(
    (productId: string) => {
      const product = selectedProducts.find((p) => p.id === productId);
      if (product) {
        toast.info(`Removed "${product.name}" from comparison`);
        setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));
      }
    },
    [selectedProducts]
  );

  const clearCompare = useCallback(() => {
    setSelectedProducts([]);
    toast.info("Comparison cleared");
  }, []);

  const isInCompare = useCallback(
    (productId: string) => selectedProducts.some((p) => p.id === productId),
    [selectedProducts]
  );

  const value: CompareContextValue = {
    selectedProducts,
    addToCompare,
    removeFromCompare,
    clearCompare,
    isInCompare,
    canAddMore: selectedProducts.length < MAX_COMPARE_ITEMS,
    compareCount: selectedProducts.length,
  };

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
