import { STORAGE_KEYS } from "../../constants";
import type { ViewMode } from "../../types";
import { useLocalStorage } from "./useLocalStorage";

export function useMarketplaceViewMode(defaultMode: ViewMode = "grid-4") {
  return useLocalStorage<ViewMode>(STORAGE_KEYS.VIEW_MODE, defaultMode);
}
