import { FavoritesLoadState } from "@/core/features/favorites/load/favorites_load_state";
import { Progress } from "@/core/ui/components/progress_line/progress";

export function measureFavoritesLoadProgress(favoritesLoadState: FavoritesLoadState): Progress {
  switch (favoritesLoadState.phase) {
    case "fetching":
    case "restoring":
      return favoritesLoadState.expectedCount === null || favoritesLoadState.expectedCount === 0 ? "indeterminate" : favoritesLoadState.loadedCount / favoritesLoadState.expectedCount;
    case "loaded":
    case "interrupted":
      return "idle";
    default:
      return "indeterminate";
  }
}
