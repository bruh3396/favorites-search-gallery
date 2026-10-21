import { LoadState } from "@/core/features/favorites/load/state";
import { Progress } from "@/core/ui/components/progress_line/progress_line";

export function measureLoadProgress(state: LoadState): Progress {
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
