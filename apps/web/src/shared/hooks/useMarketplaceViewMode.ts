import { STORAGE_KEYS } from "../../constants";
import type { ViewMode } from "../../types";
import { useLocalStorage } from "./useLocalStorage";

export function useMarketplaceViewMode(
  defaultMode: ViewMode = "grid-4",
  storageKey: string = STORAGE_KEYS.VIEW_MODE
) {
  return useLocalStorage<ViewMode>(storageKey, defaultMode);
}
