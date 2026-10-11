import { FavoritesService } from "@/core/features/favorites/favorites";
import { StatusText } from "@/core/ui/components/status_text/status_text";
import { computed } from "@/core/utils/reactive/signal";
import { describeLoadState } from "@/core/features/favorites/load/status";
import { h } from "@/core/ui/h/h";

export const FavoritesShellClass = {
  root: "fsg-FavoritesShell",
  header: "fsg-FavoritesShell-header",
  status: "fsg-FavoritesShell-status",
  panes: "fsg-FavoritesShell-panes"
} as const;

export interface FavoritesShellProps {
  favorites: Pick<FavoritesService, "loadState">;
  panes: readonly HTMLElement[];
}

export function FavoritesShell({ favorites, panes }: FavoritesShellProps): HTMLElement {
  return (
    <div className={FavoritesShellClass.root}>
      <header className={FavoritesShellClass.header}>
        <div className={FavoritesShellClass.status}>
          <StatusText text={computed(() => describeLoadState(favorites.loadState.value))} />
        </div>
      </header>
      <main className={FavoritesShellClass.panes}>{panes}</main>
    </div>
  );
}
