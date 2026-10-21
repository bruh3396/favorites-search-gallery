import { Readable, computed } from "@/core/utils/reactive/signal";
import { FavoritesService } from "@/core/features/favorites/favorites";
import { ProgressLine } from "@/core/ui/components/progress_line/progress_line";
import { StatusText } from "@/core/ui/components/status_text/status_text";
import { describeLoadState } from "@/core/features/favorites/load/status";
import { h } from "@/core/ui/h/h";
import { measureLoadProgress } from "@/core/app/favorites_page/load_progress";

export const FavoritesShellClass = {
  root: "fsg-FavoritesShell",
  loadLine: "fsg-FavoritesShell-loadLine",
  panes: "fsg-FavoritesShell-panes",
  statusBar: "fsg-FavoritesShell-statusBar",
  resultCount: "fsg-FavoritesShell-resultCount"
} as const;

export interface FavoritesShellProps {
  favorites: Pick<FavoritesService, "loadState">;
  resultCount: Readable<number>;
  panes: readonly HTMLElement[];
}

export function FavoritesShell({ favorites, resultCount, panes }: FavoritesShellProps): HTMLElement {
  const progress = computed(() => measureLoadProgress(favorites.loadState.value));
  return (
    <div className={FavoritesShellClass.root}>
      <div className={FavoritesShellClass.loadLine}>
        <ProgressLine label="Loading favorites" progress={progress} />
      </div>
      <main className={FavoritesShellClass.panes}>{panes}</main>
      <footer className={FavoritesShellClass.statusBar}>
        <StatusText text={computed(() => describeLoadState(favorites.loadState.value))} />
        <span className={FavoritesShellClass.resultCount}>
          {computed(() => (progress.value === "idle" ? describeResultCount : describeCountSoFar)(resultCount.value))}
        </span>
      </footer>
    </div>
  );
}

function describeResultCount(count: number): string {
  return count === 1 ? "1 result" : `${count.toLocaleString()} results`;
}

function describeCountSoFar(count: number): string {
  return `${count.toLocaleString()} so far`;
}
