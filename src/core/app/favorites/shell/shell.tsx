import { FavoritesService } from "@/core/features/favorites/favorites";
import { ProgressLine } from "@/core/ui/components/progress_line/progress_line";
import { Readable, computed } from "@/core/utils/reactive/signal";
import { h } from "@/core/ui/h/h";
import { measureLoadProgress } from "@/core/app/favorites/shell/load_progress";

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
        Press Z or Esc to exit zen
      </div>
    </div>
  );
}
