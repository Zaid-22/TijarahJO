import type { ViewMode } from "../../types";

const VIEW_MODE_GRID_CLASS: Record<ViewMode, string> = {
  "grid-4": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  "grid-3": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  "grid-2": "grid-cols-1 sm:grid-cols-2",
  list: "grid-cols-1",
};

export function getViewModeGridClass(viewMode: ViewMode): string {
  return VIEW_MODE_GRID_CLASS[viewMode];
}

