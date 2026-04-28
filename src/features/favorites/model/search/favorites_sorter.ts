import { FavoriteItem } from "../../types/favorite_item";
import { Preferences } from "../../../../lib/preferences/preferences";
import { shuffleArray } from "../../../../utils/collection/array";

export function sortFavorites(favorites: FavoriteItem[]): FavoriteItem[] {
  const sortingMethod = Preferences.sortingMethod.value;

  if (sortingMethod === "random") {
    return shuffleArray([...favorites]);
  }
  const sorted = [...favorites].sort((a, b) => b.metrics[sortingMethod] - a.metrics[sortingMethod]);
  return Preferences.sortAscendingEnabled.value ? sorted.reverse() : sorted;
}
