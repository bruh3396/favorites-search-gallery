import { Readable, computed } from "@/core/utils/reactive/signal";
import { FavoritesLoadState } from "@/core/features/favorites/load/favorites_load_state";
import { FavoritesService } from "@/core/features/favorites/favorites_service";
import { Progress } from "@/core/ui/components/progress_line/progress";
import { ProgressLine } from "@/core/ui/components/progress_line/progress_line";
import { h } from "@/core/ui/h/h";

export const FavoritesShellClass = {
  root: "fsg-FavoritesShell",
  loadLine: "fsg-FavoritesShell-loadLine",
  panes: "fsg-FavoritesShell-panes",
  zenHint: "fsg-FavoritesShell-zenHint"
} as const;

export interface FavoritesShellProps {
  favorites: Pick<FavoritesService, "loadState">;
  panes: readonly HTMLElement[];
  zenEnabled: Readable<boolean>;
}

export function FavoritesShell({ favorites, panes, zenEnabled }: FavoritesShellProps): HTMLElement {
  return (
    <div className={FavoritesShellClass.root} data-zen={computed(() => (zenEnabled.value ? "" : null))}>
      <div className={FavoritesShellClass.loadLine}>
        <ProgressLine label="Loading favorites" progress={computed(() => measureLoadProgress(favorites.loadState.value))} />
      </div>
      <main className={FavoritesShellClass.panes}>{panes}</main>
      <div className={FavoritesShellClass.zenHint} role="status" hidden={computed(() => !zenEnabled.value)} data-zen-stage="">
        Press Z or Esc to exit Zen
      </div>
    </div>
  );
}

function measureLoadProgress(state: FavoritesLoadState): Progress {
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
