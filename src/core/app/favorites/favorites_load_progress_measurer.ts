import { FavoritesLoadState } from "@/core/features/favorites/load/favorites_load_state";
import { Progress } from "@/core/ui/components/progress_line/progress";

export function measureFavoritesLoadProgress(state: FavoritesLoadState): Progress {
  switch (state.phase) {
    case "fetching":
    case "restoring":
      return state.expectedCount === null || state.expectedCount === 0 ? "indeterminate" : state.loadedCount / state.expectedCount;
    case "loaded":
    case "interrupted":
      return "idle";
    default:
      return "indeterminate";
  }
}
