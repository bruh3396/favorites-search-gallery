import { Emitter } from "@/core/utils/reactive/emitter";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesSearchSession } from "@/core/features/favorites/search/session";
import { Signal } from "@/core/utils/reactive/signal";
import { TileLocator } from "@/core/ui/post_grid/tile_locator";

export interface FavoritesTab {
  readonly session: FavoritesSearchSession;
  readonly scrollTo: Emitter<Favorite>;
  readonly tileLocator: TileLocator<Favorite>;
  readonly visiblePosts: Signal<readonly Favorite[]>;
}

export function createFavoritesTab(session: FavoritesSearchSession): FavoritesTab {
  return { session, scrollTo: new Emitter(), tileLocator: new TileLocator(), visiblePosts: new Signal<readonly Favorite[]>([]) };
}
