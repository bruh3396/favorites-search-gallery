import { FavoriteItem } from "../../../types/favorite/favorite_item";
import { Preferences } from "../../../../../store/local_storage/preferences";
import { SortingMethod } from "../../../../../types/primitives/primitives";
import { shuffleArray } from "../../../../../utils/collection/array";

let useAscendingOrder = Preferences.sortAscendingEnabled.value;
let sortingMethod: SortingMethod = Preferences.sortingMethod.value;

export function setAscendingOrder(value: boolean): void {
  useAscendingOrder = value;
}

export function setSortingMethod(value: SortingMethod): void {
  sortingMethod = value;
}

export function sortFavorites(favorites: FavoriteItem[]): FavoriteItem[] {
  const toSort = favorites.slice();

  if (sortingMethod === "random") {
    return shuffleArray(toSort);
  }
  toSort.sort((a, b) => b.metrics[sortingMethod] - a.metrics[sortingMethod]);
  return useAscendingOrder ? toSort.reverse() : toSort;
}
