import { Readable, computed } from "@/core/utils/reactive/signal";
import { Emitter } from "@/core/utils/reactive/emitter";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesSession } from "@/core/features/favorites/session/session";
import { TileLocator } from "@/core/ui/post_grid/tile_locator";

export interface FavoritesTab {
  readonly session: FavoritesSession;
  readonly title: Readable<string>;
  readonly focusSearch: Emitter<void>;
  readonly tileLocator: TileLocator<Favorite>;
}

export function createFavoritesTab(session: FavoritesSession): FavoritesTab {
  return {
    session,
    title: computed(() => session.query.value || "New"),
    focusSearch: new Emitter(),
    tileLocator: new TileLocator()
  };
}
