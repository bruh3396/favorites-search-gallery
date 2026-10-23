import { Readable, Signal, computed } from "@/core/utils/reactive/signal";
import { Emitter } from "@/core/utils/reactive/emitter";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesSession } from "@/core/features/favorites/session/session";
import { TileLocator } from "@/core/ui/post_grid/tile_locator";

export interface FavoritesTab {
  readonly session: FavoritesSession;
  readonly title: Readable<string>;
  readonly scrollTo: Emitter<Favorite>;
  readonly focusSearch: Emitter<void>;
  readonly tileLocator: TileLocator<Favorite>;
  readonly visiblePosts: Signal<readonly Favorite[]>;
}

export function createFavoritesTab(session: FavoritesSession): FavoritesTab {
  return {
    session,
    title: computed(() => session.query.value || "New"),
    scrollTo: new Emitter(),
    focusSearch: new Emitter(),
    tileLocator: new TileLocator(),
    visiblePosts: new Signal<readonly Favorite[]>([])
  };
}
