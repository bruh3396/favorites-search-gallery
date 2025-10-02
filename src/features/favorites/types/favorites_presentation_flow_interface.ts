import { FavoriteLayout, NavigationKey } from "../../../types/common_types";
import { FavoriteItem } from "./favorite/favorite_item";

export interface FavoritesPresentationFlow {
  present: (results: FavoriteItem[]) => void
  onLayoutChanged: (layout: FavoriteLayout) => void
  revealFavorite: (id: string) => void
  reset: () => void
  handleNewSearchResults: () => void
  handlePageChangeRequest: (direction: NavigationKey) => void
}
