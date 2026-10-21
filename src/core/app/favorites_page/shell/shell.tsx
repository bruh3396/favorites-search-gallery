import { FavoritesService } from "@/core/features/favorites/favorites";
import { ProgressLine } from "@/core/ui/components/progress_line/progress_line";
import { StatusText } from "@/core/ui/components/status_text/status_text";
import { computed } from "@/core/utils/reactive/signal";
import { describeLoadState } from "@/core/features/favorites/load/status";
import { h } from "@/core/ui/h/h";
import { measureLoadProgress } from "@/core/app/favorites_page/shell/load_progress";

export const FavoritesShellClass = {
  root: "fsg-FavoritesShell",
  banner: "fsg-FavoritesShell-banner",
  loadLine: "fsg-FavoritesShell-loadLine",
  panes: "fsg-FavoritesShell-panes"
} as const;

export interface FavoritesShellProps {
  favorites: Pick<FavoritesService, "loadState">;
  panes: readonly HTMLElement[];
}

export function FavoritesShell({ favorites, panes }: FavoritesShellProps): HTMLElement {
  return (
    <div className={FavoritesShellClass.root}>
      <div className={FavoritesShellClass.banner} hidden={computed(() => favorites.loadState.value.phase === "loaded")}>
        <StatusText text={computed(() => describeLoadState(favorites.loadState.value))} />
        <div className={FavoritesShellClass.loadLine}>
          <ProgressLine label="Loading favorites" progress={computed(() => measureLoadProgress(favorites.loadState.value))} />
        </div>
      </div>
      <main className={FavoritesShellClass.panes}>{panes}</main>
    </div>
  );
}
