import {FAVORITES_CONTENT_CONTAINER} from "../../page_builder/structure";
import {FavoriteItem} from "../../types/favorite/favorite";

function getMoreResults(allFavorites: FavoriteItem[]): FavoriteItem[] {
  const batch = [];

  for (const favorite of allFavorites) {
    if (FAVORITES_CONTENT_CONTAINER.querySelector(`#${favorite.id}`) === null) {
      batch.push(favorite);
    }

    if (batch.length >= 25) {
      break;
    }
  }
  return batch;
}

export const InfiniteScrollFeeder = {
  getMoreResults
};
