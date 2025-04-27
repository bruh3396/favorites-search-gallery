import {FavoriteLayout, NavigationKey} from "../../../../types/primitives/primitives";
import {FavoriteItem} from "../../types/favorite/favorite";

export interface FavoritesPresenter {
  present: (results: FavoriteItem[]) => void
  changeLayout: (layout: FavoriteLayout) => void
  revealFavorite: (id: string) => void
  reset: () => void
  handleNewSearchResults: () => void
  handlePageChangeRequest: (direction: NavigationKey) => void
}
