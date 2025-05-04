import { FavoriteItem } from "../../types/favorite/favorite_item";

export function getMoreResults(allFavorites: FavoriteItem[]): HTMLElement[] {
  const batch = [];

  for (const favorite of allFavorites) {
    if (document.getElementById(favorite.id) === null) {
      batch.push(favorite.root);
    }

    if (batch.length >= 25) {
      break;
    }
  }
  return batch;
}
