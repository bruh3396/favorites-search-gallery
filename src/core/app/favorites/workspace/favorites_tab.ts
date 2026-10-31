import { Readable, computed } from "@/core/utils/reactive/signal";
import { Emitter } from "@/core/utils/reactive/emitter";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesSession } from "@/core/features/favorites/session/favorites_session";
import { TileLocator } from "@/core/ui/post_grid/tile_locator";

export interface FavoritesTab {
  readonly session: FavoritesSession;
  readonly title: Readable<string>;
  readonly focusSearch: Emitter<void>;
  readonly tileLocator: TileLocator<Favorite>;
}

export function createFavoritesTab(favoritesSession: FavoritesSession): FavoritesTab {
  return {
    session: favoritesSession,
    title: computed(() => favoritesSession.query.value || "New"),
    focusSearch: new Emitter(),
    tileLocator: new TileLocator()
  };
}
