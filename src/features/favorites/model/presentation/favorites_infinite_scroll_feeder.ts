import {FavoriteItem} from "../../types/favorite/favorite_item";

export function getMoreResults(allFavorites: FavoriteItem[]): FavoriteItem[] {
  const batch = [];

  for (const favorite of allFavorites) {
    if (document.getElementById(favorite.id) === null) {
      batch.push(favorite);
    }

    if (batch.length >= 25) {
      break;
    }
  }
  return batch;
}
